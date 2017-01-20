;
(function() {
    $(window).ready(function() {
        arhat.once('success', function() {
            var center = [43.653226, -79.38318429999998];

            var osmUrl = 'http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
                osmAttrib = '&copy; <a href="http://openstreetmap.org/copyright">OpenStreetMap</a> contributors',
                osm = L.tileLayer(osmUrl, { maxZoom: 18, attribution: osmAttrib });
            var map = new L.Map('map', { layers: [osm], center: new L.LatLng(center[0], center[1]), zoom: 9 });
            var options = {
                radius: 12,
                opacity: 0.5,
                duration: 500,
                lng: function(d) {
                    return d[0];
                },
                lat: function(d) {
                    return d[1];
                },

                value: function(d) { return d.length; },

                valueFloor: undefined,
                valueCeil: undefined,
                onmouseover: function(d, node, layer) {
                    console.log('mouseover: ' + d.length);
                }
            };

            var hexLayer = L.hexbinLayer(options).addTo(map);

            hexLayer.colorScale().range(['yellow', 'red']);
            with(arhat.constants()) {
                arhat.tables.create({
                    uri: 'file://D://pw_view.csv',
                    view: {}
                }, function(createTableResult) {
                    var view = arhat.table(createTableResult.tableId).view(createTableResult.viewId);
                    var group = view.groups.create([{
                            groups: [{ type: 'TIMESTAMP', precision: 'MONTH', field: '订单创建时间' }],
                            reduces: [{ type: 'Count' }]
                        },
                        {
                            groups: [{ type: 'TIMESTAMP', precision: 'DAY', field: '订单创建时间' }],
                            reduces: [{ type: 'Count' }]
                        }

                    ], function(result) {
                        var groups = [];
                        _.each(result.groupIds || [result.groupId], function(groupId, index) {
                            var group = view.group(groupId);
                            groups.push(group);
                        });

                        var color = d3.scale.quantize().range(['#E4F1FA', '#C9E1F3', '#B3D5EE', '#94C4E7', '#76B4E0', '#5DA5DA']);
                        color.domain([0, 10]);

                        var colorValues = {};

                        var center = [43.653226, -79.38318429999998];
                        var latFn = d3.random.normal(center[0], 1);
                        var longFn = d3.random.normal(center[1], 1);
                        var time;

                        function times(data) {
                            var $timesdiv = $(document.querySelector('.times'));
                            $timesdiv.empty();
                            var repaint_data = _.slice(data, 0, 24);

                            repaint_data.forEach(function(d, index) {
                                var $time_span = $(document.createElement('span'));
                                $time_span.addClass('hour');
                                if (index < 12) {
                                    $time_span.addClass('am');
                                } else {
                                    $time_span.addClass('pm');
                                }
                                $time_span.attr('title', d.time);
                                $time_span.css('background', color(d.count));
                                $time_span.data(d.data);
                                $time_span.appendTo($timesdiv);
                            })

                            var $hours_am = $('.hour.am');
                            var $hours_pm = $('.hour.pm');

                            $hours_pm.hide();

                            times.repaint = function() {
                                _.forEach($('.times .hour'), function(hour, index) {
                                    var $hour = $(hour);
                                    var d = repaint_data[index];
                                    $hour.attr('title', d.time);
                                    $hour.css('background', color(d.count));
                                    $hour.data(d.data);
                                })
                            }

                            var $am_pm = $(document.createElement('span'));
                            $am_pm.addClass('flatpickr-am-pm');
                            $am_pm.text('AM');
                            $am_pm.attr('title', 'Click to toggle');
                            $am_pm.appendTo($timesdiv);

                            times.container = $timesdiv;
                            times.selectedItem = [];
                            times.getSelectedData = function() {
                                var data = [];
                                _.forEach(times.selectedItem, function(item) {
                                    var $item = $(item);
                                    data = data.concat($item.data());
                                })
                                return data;
                            }

                            $timesdiv.off('click').on('click', 'span', function(e) {
                                e.preventDefault()
                                var $target = $(e.target)
                                if ($target.hasClass('flatpickr-am-pm')) {
                                    if ($target.text() === 'PM') {
                                        $target.text('AM')
                                        $hours_pm.hide()
                                        $hours_am.show()
                                    } else {
                                        $target.text('PM')
                                        $hours_pm.show()
                                        $hours_am.hide()
                                    }
                                    times.repaint()
                                } else {
                                    $target.toggleClass('selected')
                                    times.selectedItem = []
                                    _.forEach(times.container.find('.selected'), function(item) {
                                        times.selectedItem.push(item)
                                    })
                                }
                            })

                            return times;
                        }

                        var fp = flatpickr('.flatpickr', {
                            'inline': true,
                            'mode': 'single',
                            'locale': Flatpickr.l10ns.zh,
                            clickOpens: false,
                            onChange: function(selectedDates, dateStr, instance) {
                                var dayGroup = groups[1];
                                var keys = selectedDates.map(function(date) {
                                    return new Date(date.getFullYear() + '-' + (date.getMonth() + 1) + '-' + date.getDate()).getTime().toString();
                                });

                                dayGroup.selectExact(keys, function(result) {
                                    view.selections({
                                        skip: 0,
                                        limit: result.selected
                                    }, function(data) {
                                        if (selectedDates.length === 1) {
                                            var hourGroup = _.groupBy(data, function(d) {
                                                return new Date(d[2]).getHours();
                                            });
                                            var date = new Date(selectedDates[0]);
                                            var repaintData = _.times(24, function(i) {
                                                return {
                                                    time: date.getFullYear() + '-' + (date.getMonth() + 1) + '-' + date.getDate() + ' ' + i,
                                                    count: 0,
                                                    data: []
                                                }
                                            });

                                            _.forEach(hourGroup, function(d, key) {
                                                var obj = repaintData[key];
                                                obj.count = d.length;
                                                obj.data = d;
                                            });

                                            time = times(repaintData);
                                            time.container.show();
                                        } else {
                                            time.container.hide();
                                        }
                                    });
                                });
                            },
                            onDayCreate: function(dObj, dStr, fp, dayElem) {
                                dayElem.classList.add('arhat-hack');
                                if (_.size(colorValues) > 0) {
                                    if (!dayElem.classList.contains('nextMonthDay') && !dayElem.classList.contains('prevMonthDay')) {
                                        var count = colorValues[dayElem.textContent].length;
                                        if (count === 0) {
                                            dayElem.classList.add('disabled');
                                        } else {
                                            dayElem.style.background = color(count);
                                        }
                                    }
                                }
                            },
                            onReady: function(dObj, dStr, fp, dayElem) {
                                var monthGroup = groups[0];
                                var now = new Date();
                                var currentDate = now.getFullYear() + '-' + (now.getMonth() + 1);
                                monthGroup.selectExact([new Date(currentDate).getTime().toString()], function(result) {
                                    view.selections({
                                        skip: 0,
                                        limit: result.selected
                                    }, function(data) {
                                        var dayGroup = _.groupBy(data, function(d) {
                                            return new Date(d[2]).getDate();
                                        });
                                        var dayCollection = $(fp.days).children().not('.prevMonthDay').not('.nextMonthDay');
                                        _.forEach(dayCollection, function(dayElem) {
                                            var count = (colorValues[dayElem.textContent] = dayGroup[dayElem.textContent] || []).length;
                                            if (count === 0) {
                                                dayElem.classList.add('disabled');
                                            } else {
                                                dayElem.style.background = color(count);
                                            }
                                        });
                                    });
                                });
                            }
                        })

                        fp.input.type = 'hidden'
                        fp.calendarContainer.classList.remove('arrowTop')
                        document.querySelector('.reset').addEventListener('click', function() {
                            fp.clear();
                            colorValues = {};
                        })

                        $('.toggleMode').on('click', function(e) {
                            fp.clear();
                            var $target = $(e.target);
                            if (fp.config.mode === 'single') {
                                fp.set('mode', 'multiple');
                                $target.text('单选');
                            } else {
                                fp.set('mode', 'single');
                                $target.text('多选');
                            }
                        })
                    });
                });
            }
        });
    })
})(window)