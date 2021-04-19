import * as tf from '@tensorflow/tfjs';

export default {
    data() {
        return {};
    },
    mounted() {},
    computed: {},
    methods: {
        activeDrawMode() {
            let map = window.map;
            map.on('touchstart', this.mousedown);
            map.on('touchmove', this.mousemove);
            map.on('touchend', this.mouseup);
        },
        unActiveDrawMode() {
            let map = window.map;
            map.off('touchstart', this.mousedown);
            map.off('touchmove', this.mousemove);
            map.off('touchend', this.mouseup);
        },
        initDrawEnvironment() {
            let map = window.map;
            this.temp_freeshape_geojson = {
                type: 'FeatureCollection',
                features: [],
            };
            //为本次绘制准备一个临时的图层供绘制
            if (!map.getSource('temp_freeshape_geojson')) {
                map.addSource('temp_freeshape_geojson', {
                    type: 'geojson',
                    data: this.temp_freeshape_geojson,
                });
                map.addLayer({
                    id: 'temp_freeshape_layer',
                    type: 'line',
                    source: 'temp_freeshape_geojson',
                    paint: {
                        'line-opacity': 0.4,
                        'line-color': ['get', 'color'],
                        'line-width': ['get', 'width'],
                    },
                });

                this.isStartDrawFreeShape = false;
                this.mousedown = e => {
                    e.preventDefault();
                    if (this.autoAsyncTimer) {
                        clearTimeout(this.autoAsyncTimer);
                        this.autoAsyncTimer = undefined;
                    }
                    this.temp_freeshape_geojson.features[
                        this.temp_freeshape_geojson.features.length
                    ] = {
                        type: 'Feature',
                        properties: {
                            color: 'blue',
                            width: 4,
                        },
                        geometry: {
                            type: 'LineString',
                            coordinates: [[e.lngLat.lng, e.lngLat.lat]],
                        },
                    };
                    map.getSource('temp_freeshape_geojson').setData(this.temp_freeshape_geojson);
                    this.isStartDrawFreeShape = true;
                };
                this.mousemove = e => {
                    if (this.isStartDrawFreeShape) {
                        this.temp_freeshape_geojson.features[
                            this.temp_freeshape_geojson.features.length - 1
                        ].geometry.coordinates.push([e.lngLat.lng, e.lngLat.lat]);
                        window.map
                            .getSource('temp_freeshape_geojson')
                            .setData(this.temp_freeshape_geojson);
                    }
                };

                this.mouseup = () => {
                    window.map
                        .getSource('temp_freeshape_geojson')
                        .setData(this.temp_freeshape_geojson);
                    this.isStartDrawFreeShape = false;

                    //松手后就开始倒计时1s，时间到后自动同步
                    this.autoAsyncTimer = setTimeout(() => {
                        this.autoAsyncTimer = undefined;
                        this.finishDrawFreeShape();
                    }, 1000);
                };
            }
        },
        finishDrawFreeShape() {
            let map = window.map;
            // 回收资源，解除监听事件
            if (this.temp_freeshape_geojson.features.length > 0) {
                //过滤一些可能是误碰的点
                this.temp_freeshape_geojson.features = this.temp_freeshape_geojson.features.filter(
                    f => f.geometry.coordinates.length > 1
                );
                //再次判断
                if (this.temp_freeshape_geojson.features.length > 0) {
                    let features = this.temp_freeshape_geojson.features;
                    let pixlist = [];
                    for (let i = 0; i < features.length; i++) {
                        let coordinates = features[i].geometry.coordinates;
                        let pixs = coordinates.map(c => {
                            let pix = this.map.project(c);
                            return [pix.x, pix.y];
                        });
                        pixlist = pixlist.concat(pixs);
                    }
                    this.softmax(pixlist);
                    // this.getJuzhen();
                    this.getImgData();
                }
                this.temp_freeshape_geojson.features = [];
                map.getSource('temp_freeshape_geojson').setData(this.temp_freeshape_geojson);
            }
            this.drawtype = -1;
        },
        softmax(arrdata) {
            let xlist = [];
            let ylist = [];
            arrdata.map(function(item) {
                xlist.push(item[0]);
            });
            arrdata.map(function(item) {
                ylist.push(item[1]);
            });
            let minx = Math.min.apply(null, xlist);
            let miny = Math.min.apply(null, ylist);
            let maxx = Math.max.apply(null, xlist);
            let maxy = Math.max.apply(null, ylist);
            this.pixx = parseInt(maxx - minx);
            this.pixy = parseInt(maxy - miny);
            this.arrdata = arrdata.map(item => {
                return [item[0] - minx, item[1] - miny];
            });
        },
        getJuzhen() {
            let imgdata = new Array();
            for (let x = 0; x < this.pixx; x++) {
                imgdata[x] = new Array();
                for (let y = 0; y < this.pixy; y++) {
                    let data = this.arrdata.filter(item => {
                        return Math.abs(item[0] - x) <= 1 && Math.abs(item[1] - y) <= 1;
                    });
                    if (data.length > 0) {
                        imgdata[x][y] = [255, 255, 255, 1];
                    } else {
                        imgdata[x][y] = [0, 0, 0, 1];
                    }
                }
            }
        },
        getImgData() {
            let width = 28;
            let height = 28;
            let imagedata = this.iCtx.createImageData(width, height);
            let offx = this.pixx / width;
            let offy = this.pixy / height;
            let data = imagedata.data;
            let newdata = [];
            for (let i = 0; i < this.arrdata.length; i++) {
                let d = this.arrdata[i];
                let pd = [parseInt(d[0] / offx), parseInt(d[1] / offy)];
                newdata.push(pd);
            }
            for (let i = 0; i < data.length; i += 4) {
                let y = parseInt(i / (4 * height)); //第几行
                let x = parseInt((i % (4 * width)) / 4); //第几列

                let index = newdata.findIndex(item => item[0] == x && item[1] == y);
                if (index != -1) {
                    data[i] = 255; // red
                    data[i + 1] = 0; // green
                    data[i + 2] = 0; // blue
                    data[i + 3] = 255;
                }
                if (i == data.length - 4) {
                    this.iCtx.putImageData(imagedata, 0, 0);
                    let dog = document.getElementById('dog')
                    dog.src = this.iCanvas.toDataURL("image/png")
                    let dom = document.getElementById('canvas');
                    this.predict_icon(dom);
                }
            }
        },
        predict_icon(dom) {
            let pixels = tf.browser.fromPixels(dom);
            let result = this.predict(pixels);
            let class_result = this.getTopKClasses(result, 5);
            console.log(class_result);
            class_result.forEach(element => {
                console.log(element.label);
            });
        },
    },
    watch: {
        drawtype(newval) {
            if (newval == 6) {
                this.initDrawEnvironment();
                this.activeDrawMode();
            } else {
                this.unActiveDrawMode();
            }
        },
    },
};
