;
(function() {
    $(window).ready(function() {
        arhat.once('success', function() {
            var center = [43.653226, -79.38318429999998];

            var osmUrl = 'http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
                osmAttrib = '&copy; <a href="http://openstreetmap.org/copyright">OpenStreetMap</a> contributors',
                osm = L.tileLayer(osmUrl, { maxZoom: 18, attribution: osmAttrib });
            var map = new L.Map('map', { layers: [osm], center: new L.LatLng(center[0], center[1]), zoom: 8 });
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
            // var colors = ['#E4F1FA', '#C9E1F3', '#B3D5EE', '#94C4E7', '#76B4E0', '#5DA5DA'];
            var colors = ['rgb(214, 230, 133)', 'rgb(30, 104, 35)'];

            hexLayer.colorScale().range(colors);
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

                        function createColorScale(colors) {
                            return d3.scale.linear().range(colors);
                        }

                        var dayColor = createColorScale(colors);
                        var hourColor = createColorScale(colors);

                        var colorValues = {};

                        var center = [43.653226, -79.38318429999998];
                        var latFn = d3.random.normal(center[0], 1);
                        var longFn = d3.random.normal(center[1], 1);
                        var time;

                        function times(data) {
                            var $timesdiv = $(document.querySelector('.times'));
                            $timesdiv.empty();
                            var repaint_data = _.slice(data, 0, 24);
                            var all_data = [];

                            function setElem($elem, d) {
                                $elem.attr('title', d.time);
                                $elem.css('background', d.count > 0 ? hourColor(d.count) : 'rgb(238, 238, 238)');
                                // $elem.text(d.count);
                                $elem.data(d.data);
                            }

                            repaint_data.forEach(function(d, index) {
                                var $time_span = $(document.createElement('span'));
                                $time_span.addClass('hour');
                                if (index < 12) {
                                    $time_span.addClass('am');
                                } else {
                                    $time_span.addClass('pm');
                                }
                                // setElem($time_span, d);
                                $time_span.appendTo($timesdiv);
                                all_data = all_data.concat(d.data);
                            });

                            var $hours_am = $('.hour.am');
                            var $hours_pm = $('.hour.pm');

                            $hours_pm.hide();

                            times.repaint = function() {
                                _.forEach($('.times .hour'), function(hour, index) {
                                    var $hour = $(hour);
                                    var d = repaint_data[index];
                                    setElem($hour, d);
                                })
                            }

                            times.repaint();

                            var $am_pm = $(document.createElement('span'));
                            $am_pm.addClass('flatpickr-am-pm');
                            $am_pm.text('AM');
                            $am_pm.attr('title', 'Click to toggle');
                            $am_pm.appendTo($timesdiv);

                            times.container = $timesdiv;

                            $timesdiv.off('click').on('click', 'span', function(e) {
                                e.preventDefault();
                                var $target = $(e.target);
                                if ($target.hasClass('flatpickr-am-pm')) {
                                    if ($target.text() === 'PM') {
                                        $target.text('AM');
                                        $hours_pm.hide();
                                        $hours_am.show();
                                    } else {
                                        $target.text('PM');
                                        $hours_pm.show();
                                        $hours_am.hide();
                                    }
                                    times.repaint();
                                } else {
                                    $target.toggleClass('selected');
                                    var selectData = [];
                                    _.forEach(times.container.find('.selected'), function(item) {
                                        var $item = $(item);
                                        selectData = selectData.concat(_.toArray($item.data()));
                                    });
                                    if (selectData.length == 0) selectData = all_data;
                                    drawHeat(selectData);
                                }
                            })

                            return times;
                        }

                        function drawHeat(data) {
                            hexLayer.data(_.map(data, function(d) {
                                return [d[14], d[13]];
                            }));
                        }

                        function modfiyDayElem(dayElem) {
                            var count = (colorValues[dayElem.textContent] || []).length;
                            if (count === 0) {
                                dayElem.classList.add('disabled');
                            } else {
                                dayElem.style.background = dayColor(count);
                            }
                        }

                        function monthChange(fp) {
                            // colorValues = {};
                            var monthGroup = groups[0];
                            var currentDate = fp.currentYear + ' ' + (fp.currentMonth + 1);
                            view.reset(function() {
                                monthGroup.selectExact([new Date(currentDate).getTime().toString()], function(result) {
                                    view.selections({
                                        skip: 0,
                                        limit: result.selected === result.size && result.groups[monthGroup.groupId].children.length > 1 ? 0 : result.selected
                                    }, function(data) {
                                        var dayGroup = _.groupBy(data, function(d) {
                                            return new Date(d[2]).getDate();
                                        });
                                        var maxArray = _.maxBy(_.toArray(dayGroup), function(obj) {
                                            return obj.length;
                                        }) || [];
                                        dayColor.domain([0, maxArray.length]);
                                        var dayCollection = $(fp.days).children().not('.prevMonthDay').not('.nextMonthDay');
                                        _.forEach(dayCollection, function(dayElem) {
                                            dayElem.classList.remove('disabled');
                                            dayElem.style.background = '';
                                            colorValues[dayElem.textContent] = dayGroup[dayElem.textContent] || []
                                            modfiyDayElem(dayElem);
                                        });

                                        drawHeat(data);
                                    });
                                });
                            })
                        }

                        var fp = flatpickr('.flatpickr', {
                            'inline': true,
                            'mode': 'single',
                            'locale': Flatpickr.l10ns.zh,
                            clickOpens: false,
                            onMonthChange: function(dObj, dStr, fp, dayElem) {
                                fp.clear();
                                monthChange(fp);
                            },
                            onChange: function(selectedDates, dateStr, instance) {
                                var dayGroup = groups[1];
                                var keys = selectedDates.map(function(date) {
                                    return new Date(date.getFullYear() + ' ' + (date.getMonth() + 1) + ' ' + date.getDate()).getTime().toString();
                                });
                                dayGroup.selectExact(keys, function(result) {
                                    view.selections({
                                        skip: 0,
                                        limit: result.selected === result.size && result.groups[dayGroup.groupId].children.length > 1 ? 0 : result.selected
                                    }, function(data) {
                                        if (instance.config.mode === 'single' && selectedDates.length === 1) {
                                            var hourGroup = _.groupBy(data, function(d) {
                                                return new Date(d[2]).getHours();
                                            });
                                            var date = new Date(selectedDates[0]);
                                            var repaintData = _.times(24, function(i) {
                                                return {
                                                    time: i + ':00' + ' ~ ' + (i + 1) + ':00',
                                                    count: 0,
                                                    data: []
                                                }
                                            });

                                            var countArray = [];

                                            _.forEach(hourGroup, function(d, key) {
                                                var obj = repaintData[key];
                                                obj.count = d.length;
                                                obj.data = d;
                                                countArray.push(d.length);
                                            });

                                            hourColor.domain([0, _.max(countArray)]);

                                            time = times(repaintData);
                                            time.container.show();

                                        } else {
                                            time && time.container.hide();
                                        }

                                        drawHeat(data);
                                    });
                                });

                            },
                            onDayCreate: function(dObj, dStr, fp, dayElem) {
                                dayElem.classList.add('arhat-hack');
                                if (dayElem.classList.contains('nextMonthDay') || dayElem.classList.contains('prevMonthDay')) {
                                    dayElem.classList.add('disabled');
                                } else if (_.size(colorValues) > 0) modfiyDayElem(dayElem);
                            },
                            onReady: function(dObj, dStr, fp, dayElem) {
                                monthChange(fp);
                            }
                        })

                        fp.input.type = 'hidden';
                        fp.calendarContainer.classList.remove('arrowTop');
                        $('.reset').on('click', function(e) {
                            e.preventDefault();
                            fp.clear();
                            monthChange(fp);
                        });

                        $('.toggleMode').on('click', function(e) {
                            e.preventDefault();
                            var currentDate = fp.currentYear + ' ' + (fp.currentMonth + 1);
                            var $target = $(e.target);
                            if (fp.config.mode === 'single') {
                                fp.set('mode', 'multiple');
                                $target.text('单选');
                            } else {
                                fp.set('mode', 'single');
                                $target.text('多选');
                            }
                            fp.setDate(new Date(currentDate).getTime());
                            fp.clear();
                            monthChange(fp);
                        });

                        $('.play').on('click', function(e) {
                            var $toggleMode = $('.toggleMode');
                            if ($toggleMode.text() === '多选') $toggleMode.click();
                            var i = 0;

                            function interval() {
                                var timeoutobj = setTimeout(function() {
                                    clearTimeout(timeoutobj);
                                    var $days = $(fp.days).children().not('.disabled');
                                    if ($days.length > i) {
                                        var elem = $days[i];
                                        if (!elem.classList.contains('disabled')) elem.click();
                                        interval();
                                        i++;
                                    } else {
                                        fp.clear();
                                        monthChange(fp);
                                    }
                                }, 500);
                            }

                            interval();

                            // $('.flatpickr-day.arhat-hack:not(".disabled")').fo
                        });
                    });
                });
            }
        });
    })
})(window)