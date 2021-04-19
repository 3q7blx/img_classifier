<template>
    <div id="mapbox">
        <div id="map"></div>
        <!-- <img id="cat" style="width:224px;height:224px" src="@/assets/0010.jpg" alt="" /> -->
        <img id="dog" style="width:28px;height:28px" />
        <canvas id="canvas" width="28" height="28"></canvas>
    </div>
</template>

<script>
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import * as tf from '@tensorflow/tfjs';
// import { loadGraphModel } from '@tensorflow/tfjs-converter';
import freeline from './freeDraw';
export default {
    components: {},
    data() {
        return {
            IMAGENET_CLASSES: [
                '侦察车',
                '便携式地空导弹',
                '反坦克导弹',
                '地空导弹',
                '坦克分队指挥车',
                '无人机',
                '步兵战车',
                '火箭炮',
                '装甲指挥车',
                '轻型坦克',
                '轻机枪',
                '迫击炮',
                '重机枪',
                '高射机枪',
                '高射炮',
            ],
        };
    },
    mixins: [freeline],
    computed: {},
    watch: {},
    created() {},
    mounted() {
        this.init();
        this.iCanvas = document.getElementById('canvas');
        this.iCtx = this.iCanvas.getContext('2d');
    },
    methods: {
        init() {
            mapboxgl.accessToken =
                'pk.eyJ1IjoibHh0aWFudGlhbiIsImEiOiJjaXd2ZjlkYnQwMTZvMnRtYWZnM2lpbHFvIn0.ef3rFZTr9psmLWahrqap2A';
            this.map = new mapboxgl.Map({
                container: 'map',
                style: 'mapbox://styles/mapbox/light-v10',
                center: [-74.0066, 40.7135],
                zoom: 15.5,
                pitch: 45,
                bearing: -17.6,
            });
            this.map.on('load', () => {
                window.map = this.map;
                this.initDrawEnvironment();
                this.activeDrawMode();
                this.load_model();
            });
        },
        async load_model() {
            let MODEL_URL = 'deeplabv3/model.json';

            this.model = await tf.loadLayersModel(MODEL_URL);
            console.log(this.model);
        },
        predict(input) {
            let INPUT_NODE_NAME = 'input_1';
            let OUTPUT_NODE_NAME = 'Identity';
            let preprocessedInput = tf.div(
                tf.sub(input.asType('float32'), tf.scalar(255 / 2)),
                tf.scalar(255 / 2)
            );
            let reshapedInput = preprocessedInput.reshape([1, ...preprocessedInput.shape]);
            return this.model.execute({ [INPUT_NODE_NAME]: reshapedInput }, OUTPUT_NODE_NAME);
        },
        getTopKClasses(logits, topK) {
            let predictions = tf.tidy(() => {
                return tf.softmax(logits);
            });
            let values = predictions.dataSync();
            predictions.dispose();
            let predictionList = [];
            for (let i = 0; i < values.length; i++) {
                predictionList.push({ value: values[i], index: i });
            }
            predictionList = predictionList
                .sort((a, b) => {
                    return b.value - a.value;
                })
                .slice(0, topK);

            return predictionList.map(x => {
                return { label: this.IMAGENET_CLASSES[x.index], value: x.value };
            });
        },
    },
};
</script>

<style>
#mapbox {
    font-family: 'Avenir', Helvetica, Arial, sans-serif;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    text-align: center;
    color: #2c3e50;
    margin-top: 60px;
}

body {
    margin: 0;
    padding: 0;
}
#map {
    position: absolute;
    top: 0;
    bottom: 0;
    width: 100%;
    height: 100%;
}
</style>
