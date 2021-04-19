<template>
    <div class="home">
        <Map v-if="False" />
        <HelloWorld />
    </div>
</template>

<script>
// @ is an alias to /src

import Map from '../components/Mapbox';
import HelloWorld from '../components/HelloWorld';
export default {
    name: 'Home',
    data() {
        return {
            False: false,
        };
    },
    components: { Map, HelloWorld },
    mounted() {},
    methods: {},
};
</script>
