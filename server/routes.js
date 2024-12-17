const mysql = require('mysql')
const config = require('./config.json')


const connection = mysql.createConnection({
  host: config.rds_host,
  user: config.rds_user,
  password: config.rds_password,
  port: config.rds_port,
  database: config.rds_db
});
connection.connect((err) => err && console.log(err));



// Route 1: GET /author/:type

const author = ( async function(req, res) {
  
  const name = 'Ning Wang';
  const pennKey = 'wangning';


  if (req.params.type === 'name') {
    
    res.send(`Created by ${name}`);
  } else if (req.params.type === 'pennkey') {
    res.send(`Created by ${pennKey}`);
  } else {
    
    res.status(400).send(`'${req.params.type}' is not a valid author type. Valid types are 'name' and 'pennkey'.`);
  }
})

// Route 2: GET /random
const random = async function(req, res) {
  
  const explicit = req.query.explicit === 'true' ? 1 : 0;


  connection.query(`
    SELECT *
    FROM Songs
    WHERE explicit <= ${explicit}
    ORDER BY RAND()
    LIMIT 1
  `, (err, data) => {
    if (err || data.length === 0) {
      // if there is an error for some reason, or if the query is empty (this should not be possible)
      // print the error message and return an empty object instead
      console.log(err);
      res.json({});
    } else {
     
      res.json({
        song_id: data[0].song_id,
        title: data[0].title
      });
    }
  });
}


// Route 3: GET /song/:song_id
const song = async function(req, res) {
 

  connection.query(`SELECT *
  FROM Songs
  WHERE song_id = '${req.params.song_id}'
  `, (err, data) => {
    if (err || data.length === 0) {
      console.log(err);
      res.json({});
    } else {
      res.json(data[0]);
    }
  });
}

// Route 4: GET /album/:album_id
const album = async function(req, res) {
  
  connection.query(`SELECT album_id, title, release_date, thumbnail_url
  FROM Albums
  WHERE album_id = '${req.params.album_id}'
  ORDER BY album_id`, (err, data) => {
    if (err || data.length === 0) {
      console.log(err);
      res.json({});
    } else {
      res.json(data[0]);
    }
  });
}

// Route 5: GET /albums
const albums = async function(req, res) {
  
  connection.query(`SELECT album_id, title, release_date, thumbnail_url
  FROM Albums
  ORDER BY release_date DESC`, (err, data) => {
    if (err || data.length === 0) {
      console.log(err);
      res.json({});
    } else {
      res.json(data);
    }
  });
}

// Route 6: GET /album_songs/:album_id
const album_songs = async function(req, res) {

  const q = `SELECT Songs.song_id, Songs.title, Songs.number, Songs.duration, Songs.plays
  FROM Songs
  WHERE album_id = '${req.params.album_id}'
  ORDER BY number ASC`

console.log(q);
  connection.query(`SELECT Songs.song_id, Songs.title, Songs.number, Songs.duration, Songs.plays
  FROM Songs
  WHERE album_id = '${req.params.album_id}'
  ORDER BY number ASC`, (err, data) => {
    if (err || data.length === 0) {
      console.log(err);
      res.json([]);
    } else {
      res.json(data);
    }
  });
}

/************************
 * ADVANCED INFO ROUTES *
 ************************/

// Route 7: GET /top_songs
const top_songs = async function(req, res) {
  const page = req.query.page;

  const pageSize = req.query.page_size ? req.query.page_size : 10;
  if (!page) {
    
   connection.query(`SELECT Songs.song_id, Songs.title, Albums.album_id, Albums.title AS album, Songs.plays
   FROM Songs
  JOIN Albums on  Songs.album_id = Albums.album_id
   Order by plays DESC
   `, (err, data) => {
     if (err || data.length === 0) {
       console.log(err);
       res.json({});
     } else {
       res.json(data);
     }
   })

  } else {
    connection.query(`SELECT Songs.song_id, Songs.title, Albums.album_id, Albums.title AS album, Songs.plays
    FROM Songs 
    JOIN Albums on Songs.album_id = Albums.album_id
    Order by plays DESC
    LIMIT ${pageSize} OFFSET ${(page - 1) * pageSize}
    `, (err, data) => {
      if (err) {
        console.log(err);
        res.json([]);
      } else {
        res.json(data);
      }
   
  })
}
};

// Route 8: GET /top_albums
const top_albums = async function(req, res) {
  
  const page = req.query.page;
  
  const pageSize = req.query.page_size ? req.query.page_size : 10;
  if (!page) {
  
   connection.query(`SELECT Albums.album_id, Albums.title, SUM(PLAYS) as plays
    FROM Songs
    JOIN Albums on Songs.album_id = Albums.album_id
   Group by Albums.title
   Order by plays desc
   `, (err, data) => {
     if (err || data.length === 0) {
       console.log(err);
       res.json([]);
     } else {
       res.json(data);
     }
   })

  } else {
    connection.query(`SELECT Albums.album_id, Albums.title, SUM(PLAYS) as plays
    FROM Songs
    JOIN Albums on  Songs.album_id = Albums.album_id
    Group by Albums.title
    Order by plays desc
    LIMIT ${pageSize} OFFSET ${(page - 1) * pageSize}
    `, (err, data) => {
      if (err) {
        console.log(err);
        res.json([]);
      } else {
        res.json(data);
      }
    
  })
}
};

// Route 9: GET /search_albums
const search_songs = async function(req, res) {
  
  const title = req.query.title ?? '';
  const durationLow = req.query.duration_low ?? 60;
  const durationHigh = req.query.duration_high ?? 660;
  const playlow = req.query.plays_low ?? 0;
  const playhigh = req.query.plays_high ?? 1100000000;
  const danceablilitylow = req.query.danceablility_low ?? 0;
  const danceablilityhigh = req.query.danceablility_high ?? 1;
  const energyLow = req.query.energy_low ?? 0;
  const energyHigh = req.query.energy_high ?? 1;
  const valencelow = req.query.valence_low ?? 0;
  const valencehigh = req.query.valence_high ?? 1;
  const explicit = req.query.explicit === 'true' ? 1 : 0;

  //console.log(c);
  //res.json([]); // replace this with your implementation
  connection.query(`
  SELECT * 
  FROM Songs
  WHERE title like '%${title}%'
  AND explicit <= ${explicit}
  AND duration BETWEEN ${durationLow} AND ${durationHigh}
  AND plays BETWEEN ${playlow} AND ${playhigh}
  AND danceability BETWEEN ${danceablilitylow} AND ${danceablilityhigh}
  AND energy BETWEEN ${energyLow} AND ${energyHigh}
  AND valence BETWEEN ${valencelow} AND ${valencehigh}
  ORDER BY title ASC
  `, (err, data) => {
    //console.log ("************", data)
    if (err || data.length === 0) {
      console.log(err);
      res.json({});
    } else {
      res.json(data);
    }
  });

}

module.exports = {
  author,
  random,
  song,
  album,
  albums,
  album_songs,
  top_songs,
  top_albums,
  search_songs,
}