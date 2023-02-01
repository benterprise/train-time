const ioRedis = require('ioredis');
const redisClient = new ioRedis();
redisClient.on('error', (err) => console.log('Redis Client Error', err));
redisClient.on('connect', () => { console.log("Connected to Redis") })
redisClient.on('end', () => { console.log("Disconnected from Redis") })

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

const arrivalReg = /^(\d+)_(.{1})..(.{1})$/

function * arrivals(array) {
    const arrayIterator = array[Symbol.iterator]()
    let tripId = arrayIterator.next()
    let timestamp = arrayIterator.next()
    while(!timestamp.done) {
        yield {
            tripId: tripId.value,
            timestamp: timestamp.value
        }
        tripId = arrayIterator.next()
        timestamp = arrayIterator.next()
    }
}

function checkErrors(req, res, next) {
    try {
        validationResult(req).throw()
        next()
    } catch (err) {
        const errors = err.array().map(err => {
            const { status, title, detail } = err.msg
            return {
                status,
                title,
                detail,
                meta: { value: err.value }
            }
        })
        res.status(400).json({ errors })
    }
}

async function handleArrivals(req, res) {
    const { timeLimit = 30, limit = 5 } = req.query;
    console.log(`${unixToDate(unixTimestamp())} - Pulling arrivals between ${unixTimestamp()} and ${fromNow(timeLimit)} for ${req.params.stopId}, limit ${limit}`)
    const rawArrivals = await redisClient.zrange(`arrivals:${req.params.stopId}`, unixTimestamp(), fromNow(timeLimit), "LIMIT", 0, limit, "BYSCORE", "WITHSCORES")
    const data = Array.from(arrivals(rawArrivals)).map(({ tripId, timestamp }) => {
        const [ _, startTime, line, direction ] = tripId.match(arrivalReg);
        return {
            type: 'arrivals',
            id: tripId,
            attributes: {
                stopId: req.params.stopId,
                startTime,
                line,
                direction,
                arrivalTime: timestamp,
                readableTime: unixToDate(timestamp)
            }
        }
    });

    res
      .status(200)
      .set("Cache-Control", "max-age=1")
      .json({ data, meta: {} });
}

function generateFakeArrivals(numArrivals) {
  const stations = ['R33', 'R34', 'R35']
  const arrivals = {}
  for (const station of stations) {
    const northStop = `${station}N`
    const southStop = `${station}S`
    arrivals[northStop] = []
    arrivals[southStop] = []
    let offset = 1200;
    for (let i = 0; i < numArrivals; i++) {
      const arrival = {
        type: 'arrivals',
        id: null,
        attributes: {
          stopId: null,
          startTime: null,
          line: 'R',
          direction: null,
          arrivalTime: null,
          readableTime: null
        }
      }
      arrivals[northStop].push(
        {
          ...arrival,
          id: `${northStop}${i}`,
          attributes: {
            ...arrival.attributes,
            stopId: northStop,
            startTime: unixTimestamp() + offset,
            direction: 'N',
            arrivalTime: unixTimestamp() + offset + 50,
            readableTime: unixToDate(unixTimestamp() + offset + 50)
          }
        }
      )

      arrivals[southStop].push(
        {
          ...arrival,
          id: `${southStop}${i}`,
          attributes: {
            ...arrival.attributes,
            stopId: southStop,
            startTime: unixTimestamp() + offset,
            direction: 'S',
            arrivalTime: unixTimestamp() + offset + 50,
            readableTime: unixToDate(unixTimestamp() + offset + 50)
          }
        }
      )
      offset += 300
    }
  }
  return arrivals
}

function handleFakeArrivals(req, res) {
  const arrivals = generateFakeArrivals(3)
  res
    .status(200)
    .set("Cache-Control", "max-age=1")
    .json({
      data: arrivals[req.params.stopId],
      meta: {}
    });
}

const host = 'localhost';
const port = 8000;

const express = require('express');
const app = express()

const session = require('express-session')
const redis = require('redis')
const redisStore = require('connect-redis')(session)
app.use(session({
  secret: 'greatSecret',
  store: new redisStore({
    host: 'localhost',
    port: 6379,
    client: redisClient
  }),
  saveUninitialized: false,
  resave: false
}))


const cors = require('cors')
app.use(cors({
  origin: 'http://localhost:5173'
}))


function setHeaders(_, res, next) {
  res.set("Content-Type", 'application/vnd.api+json');
  next()
}

function checkSession(req, res, next) {
  if (req.session.key) {
    next()
  } else {
    res.status(401)
    res.json({
      data: {
        status: 401,
        title: 'Unauthorized Request',
        detail: 'You are not authenticated to the server, please login'
      },
      meta: {}
    })
  }
}

const middleware = [
  setHeaders,
  // checkSession
]

app.get('*', middleware)


const { query, param, validationResult } = require('express-validator');

const stationIds = [
    "R35S",
    "R35N",
    "R34S",
    "R34N",
    "R33N",
    "R33S",
]
const validations = [
    param("stopId").exists().isIn(stationIds).withMessage({
        status: 400,
        title: "Invalid stopId Requested",
        detail: 'You must request a valid station ID as defined by NYCT'
    }),
    query("timeLimit").optional().isInt({ min: 1, max: 60 }).withMessage({
        status: 400,
        title: "Param: timeLimit must be between 1 and 60",
        detail: "You can only request arrivals between 1 minute from now and 60 minutes from now"
    }),
    query("limit").optional().isInt({ min: 1, max: 10 }).withMessage({
        status: 400,
        title: "Param: limit must be between 1 and 10",
        detail: "You can only request a number of arrivals between 1 and 10"
    }),
    checkErrors
]

app.get('/arrivals/:stopId', validations, handleArrivals)
app.get('/fake_arrivals/:stopId', validations, handleFakeArrivals)

app.get('/stations', (req, res, next) => {
  res.status(200).json({
    data: [
      {
        id: 'R33',
        attributes: {
          stopId: 'R33',
          stopName: '4 Av-9 St',
          stopCoordinates: '40.670847,-73.988302'
        }
      },
      {
        id: 'R34',
        attributes: {
          stopId: 'R34',
          stopName: 'Prospect Av',
          stopCoordinates: '40.665414,-73.992872'
        }
      },
      {
        id: 'R35',
        attributes: {
          stopId: 'R35',
          stopName: '25 St',
          stopCoordinates: '40.660397,-73.998091'
        }
      }
    ],
    meta: {}
  })
})

app.get('/stations/:stopId', (req, res, next) => {
  const stopId = req.params.stopId;
  const stops  = {
    R33: {
      stopId: 'R33',
      stopName: '4 Av-9 St',
      stopCoordinates: '40.670847,-73.988302'
    },
    R34: {
      stopId: 'R34',
      stopName: 'Prospect Av',
      stopCoordinates: '40.665414,-73.992872'
    },
    R35: {
      stopId: 'R35',
      stopName: '25 St',
      stopCoordinates: '40.660397,-73.998091'
    }
  }

  if (stops[stopId]) {
    res.status(200).json({
      data: {
        id: stopId,
        attributes: stops[stopId]
      },
      meta: {}
    })
  } else {
    res.status(404).json({
      data: {
        status: 404,
        title: 'Stop Not Found',
        detail: 'The StopId you have requested does not exist'
      },
      meta: {}
    })
  }
})

app.get('/user_config', (req, res, next) => {
  res.status(200).json({
    data: {
      type: 'userConfig',
      id: 1,
      attributes: {
        location: '40.66236861852265, -73.99668276926914',
        stations: ['R33','R34','R35'],
        cushionTime: 120,
        lookaheadTime: 1800,
        walkTimeToStations: {
          R33: 900,
          R34: 360,
          R35: 180
        }
      }
    },
    meta: {}
  })
})

app.get('/login', () => {})
app.post('/login', () => {})
app.get('/logout', () => {})
app.post('/logout', () => {})
app.get('/session', () => {})

const server = app.listen(port, host, () => {
    console.log(`Server is running on http://${host}:${port}`);
})

server.on("close", () => {
    redisClient.quit();
})

process.on('SIGTERM', () => {
    console.log('SIGTERM signal received: closing HTTP server')
    server.close(() => {
        console.log('HTTP server closed')
    })
})