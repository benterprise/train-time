const GtfsRealtimeBindings = require("gtfs-realtime-bindings");
const fetch = require("node-fetch");

const redis = require('redis');
const client = redis.createClient();
client.on('error', (err) => console.log('Redis Client Error', err));

function unixTimestamp (date = Date.now()) {
    return Math.floor(date / 1000)
}

function fromNow(minutes) {
    return unixTimestamp() + (minutes * 60)
}

function unixToDate(timestamp) {
    const date = new Date(timestamp * 1000)
    const time = date.toLocaleTimeString('en-US', { timeZone: 'America/New_York', hour: '2-digit', minute: '2-digit' })
    return time
}

// const pruneArrivals = async (stopId) => {
//     const now = unixTimestamp()
//     let nextArrivals = await client.zRangeWithScores(`arrivals:${stopId}`, 0, 0)
//     for await (const arrival of nextArrivals) {
//         if (arrival.score < now) {
//             await client.zPopMin(`arrivals:${stopId}`)
//         }
//     }
// }

const updateFeed = async () => {
    try {
        const res = await fetch("https://api-endpoint.mta.info/Dataservice/mtagtfsfeeds/nyct%2Fgtfs-nqrw", {
          headers: {
            "x-api-key": "APIKEYHERE",
          },
        });
        if (!res.ok) {
          const error = new Error(`${res.url}: ${res.status} ${res.statusText}`);
          error.response = res;
          throw error;
          process.exit(1);
        }
        const buffer = await res.arrayBuffer();
        const feed = GtfsRealtimeBindings.transit_realtime.FeedMessage.decode(
          new Uint8Array(buffer)
        );

        const stations = [
            "R35S",
            "R35N",
            "R34S",
            "R34N",
            "R33N",
            "R33S",
        ]
        const processTripUpdate = async (tripUpdate) => {
            tripUpdate.stopTimeUpdate.forEach(async (stopTime) => {
                if(stations.includes(stopTime.stopId)) {
                    await client.zAdd(`arrivals:${stopTime.stopId}`, { score: stopTime.arrival.time.low, value: tripUpdate.trip.tripId })
                    console.log(`${tripUpdate.trip.routeId} - ${stopTime.stopId} - ${tripUpdate.trip.tripId} @ ${stopTime.arrival.time.low} - ${unixToDate(stopTime.arrival.time.low)}`)
                }
            })
        }

        for (const entity of feed.entity) {
            if (entity.tripUpdate) {
                processTripUpdate(entity.tripUpdate)
            } else if (entity.vehicle) {}
        }
    }
    catch (error) {
        console.log(error);
        process.exit(1);
    }
}

(async () => {
    await client.connect()
    await updateFeed()
    await client.quit()
})();