let readFile = async (file) => {
    return new Promise((resolve, reject) => {
        var reader = new FileReader();
        reader.readAsText(file, "UTF-8");
        reader.onload = function (evt) {
            resolve(evt.target.result);
        }
        reader.onerror = function (evt) {
            reject()
        }
    })
}

const postData = (url, data) => {
    return fetch(url, {
        body: JSON.stringify(data),
        headers: { 'content-type': 'application/json' },
        method: 'POST',
        cache: 'no-cache', // *default, no-cache, reload, force-cache, only-if-cached
        redirect: 'follow', // manual, *follow, error
        referrer: 'no-referrer', // *client, no-referrer
        mode: 'cors'
    }).catch((error) => console.log(error)).then((response) => response.json())
}

let initMap = () => {
    let map = L.map("map").setView([57.1450394, -2.1857973], 9); // init map
    L.tileLayer('https://cartodb-basemaps-{s}.global.ssl.fastly.net/light_all/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="http://cartodb.com/attributions">CartoDB</a>',
        subdomains: 'abcd',
        maxZoom: 19
    }).addTo(map);
    map.invalidateSize();
    return map;
}

window.onload = () => {
    Vue.component('my-line', {
        props: ["line"],
        template: `
        <tr @click="onClick(line)">
            <td>{{ line.Truck_no }}</td>
            <td>{{ line.size }}</td>
            <td>{{ line.collection_date }}</td>
            <td>{{ line.collection_latitude }}</td>
            <td>{{ line.collection_longitude }}</td>
            <td>{{ line.delivery_date }}</td>
        </tr>`,
        methods: {
            onClick: function (line) {
                this.$emit("selectedline", line)
            }
        }
    })
    app = new Vue({
        el: "main",
        mounted: function () {
            this.map = initMap();
        },
        data: {
            lines: [],
            currentPolyline: null,
            marker1: null,
            marker2: null
        },
        methods: {
            readFile: async function (event) {
                console.log(`Loading file: ${event.target.files[0].name}`);
                let fileContent = await readFile(event.target.files[0]);
                console.log(`File size: ${fileContent.length}`);
                // let lines = Papa.parse(fileContent, {
                //     header: true,
                //     dynamicTyping: true,
                //     preview: 20
                // });
                let csvString = await readFile(event.target.files[0]);
                let config = {
                    header: true,
                    skipEmptyLines: true,
                    dynamicTyping: true,
                    //preview: 5000
                };
                let lines = Papa.parse(csvString, config).data;
                //console.log(`Lines parsed: ${lines.data.length}`);
                let apiResult = await postData(`http://${location.hostname}:5000/api/test`, lines);
                this.lines = apiResult.truck;
            },
            showOnMap: function (line) {
                var greenIcon = new L.Icon({
                    iconUrl: 'https://cdn.rawgit.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
                    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
                    iconSize: [25, 41],
                    iconAnchor: [12, 41],
                    popupAnchor: [1, -34],
                    shadowSize: [41, 41]
                });
                this.map.panTo(new L.LatLng(line.collection_latitude, line.collection_longitude));
                var pointA = new L.LatLng(line.collection_latitude, line.collection_longitude);
                var pointB = new L.LatLng(line.delivery_latitude, line.delivery_longitude);
                var pointList = [pointA, pointB];
                if (this.currentPolyline != null || this.marker1 != null || this.marker2 != null) {
                    this.currentPolyline.remove();
                    this.currentPolyline = null;
                    this.marker1.remove();
                    this.marker2.remove();
                }
                this.currentPolyline = new L.Polyline(pointList, {
                    color: 'red',
                    weight: 3,
                    opacity: 0.5,
                    smoothFactor: 1
                });
                this.currentPolyline.addTo(this.map);
                this.marker1 = L.marker([line.collection_latitude, line.collection_longitude], { icon: greenIcon });
                this.marker2 = L.marker([line.delivery_latitude, line.delivery_longitude]);
                this.marker1.bindPopup("Collect me from " + line.collection_latitude + line.collection_longitude);
                this.marker2.bindPopup("Deliver me at " + line.delivery_latitude + line.delivery_longitude)
                this.marker1.addTo(this.map);
                this.marker2.addTo(this.map);
            }
        }
    });
}
