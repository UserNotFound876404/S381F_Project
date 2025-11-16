const express = require('express');
const { MongoClient, ServerApiVersion, HostAddress } = require('mongodb');
const app = express();
const url = "mongodb+srv://cloud381:cloud381@cluster0.bjmfioi.mongodb.net/?appName=Cluster0";
const dbName = "school";
const collectionName = "patients";
const client = new MongoClient(url);
const bodyParser = require('body-parser');

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.set('view engine', 'ejs');
app.use(express.static('public'));
app.use("/", express.static('/views'));

app.use((req, res, next) => {
    console.log("request body: ", req.body);
    console.log(req.method + ' ' + req.url + ' was requested at ' + Date(Date.now()).toString());
    next();
})

const db = client.db(dbName);
const users = new Array(
    { name: 'admin', password: 'admin' }
);

const SECRETKEY = '381Project';

//cookies
const session = require('cookie-session');
app.use(session({
    name: 'loginSession',
    keys: [SECRETKEY]
}));


//find mongodb
const findDatabase = async (db) => {
    var collection = db.collection(collectionName);
    let cursor = await collection.find();
    results = await cursor.toArray();
    return results;
}

//insert mongodb
const insertDatabase = async (db, object) => {
    var collection = db.collection(collectionName);
    collection.insertOne(object);
}

//update mongodb
const updateDatabase = async (db, oldName, newName, age, weight, height, meds, userId) => {
    var collection = db.collection(collectionName);
    collection.updateMany({ 'name': oldName }, { $set: { 'name': newName, 'weight': weight, 'height': height, 'medicine': meds, 'userId': userId, 'age': age } });
}

//delete mongodb
const deleteDatabase = async (db, name) => {
    var collection = db.collection(collectionName);
    collection.deleteOne({ "name": name });
}

app.get('/', (req, res, next) => {
    res.redirect("/home");
});

app.get("/home", (req, res, next) => {
    res.render("home");
})

app.get('/help', (req, res, next) => {
    res.send('Help page');
});

app.get('/login', (req, res, next) => {
    res.status(200).render('login');
});

//insert
app.get('/insert', (req, res, next) => {
    res.status(200).render('insert');
})
app.post("/insert", async (req, res, next) => {
    try {
        let newObject = {};
        newObject['userId'] = req.body.userId;
        newObject['name'] = req.body.name;
        newObject['age'] = req.body.age;
        newObject['weight'] = req.body.weight;
        newObject['height'] = req.body.height;
        newObject['medicine'] = req.body.medicine;
        insertDatabase(db, newObject);
        res.status(200).redirect("success"); // sends JSON and ends response
    } catch (err) {
        console.error("Error fetching database:", err);
        res.status(500).json({ error: "Internal server error" });
    }
});

//update
app.get('/update', (req, res, next) => {
    res.status(200).render('update');
})
app.post("/update", async (req, res, next) => {
    try {
        updateDatabase(db, req.body.oldName, req.body.name, req.body.age, req.body.weight, req.body.height, req.body.medicine, req.body.userId);
        res.status(200).redirect("success");
    } catch (err) {
        console.error("Error fetching database:", err);
        res.status(500).json({ error: "Internal server error" });
    }
});

app.get('/success', (req, res, next) => {
    res.status(200).render('success');
})

app.get('/fail', (req, res) => {
    res.status(200).render('fail');
})

app.post('/login', (req, res) => {
    const found = users.find(user => user.name === req.body.name && user.password === req.body.password);
    if (found) {
        req.session.authenticated = true;
        req.session.username = req.body.name;
        return res.redirect('/list'); // return to prevent fallthrough
    }
    return res.redirect('/fail'); // single response
});

app.get('/list', async (req, res) => {
    console.log(req.session);
    if (!req.session.authenticated) {    // user not logged in!
        res.redirect('/login');
    } else {
        try {
            const data = await findDatabase(db); // wait for data
            res.status(200).render('list', { name: req.session.username, num: data.length, data: data });
        } catch (error) {
            console.error('Database fetch error:', error);
            res.status(500).send('Internal Server Error');
        }
    }
});

app.get('/logout', (req, res) => {
    req.session = null;
    res.redirect("/");
})

//Restful API
//read
//curl "localhost:8099/api"
app.get("/api", async (req, res, next) => {
    try {
        const result = await findDatabase(db); // await the helper
        res.status(200).json(result); // sends JSON and ends response
    } catch (err) {
        console.error("Error fetching database:", err);
        res.status(500).json({ error: "Internal server error" });
    }
});

//create
//curl -X POST -d name=d1 "localhost:8099/api"
//curl -X POST -d "name=test&age=40&userId=22222&weight=76&height=177&medicine=meds0&medicine=meds4" "localhost:8099/api"
app.post("/api", async (req, res, next) => {
    try {
        let newObject = {};
        newObject['userId'] = req.body.userId;
        newObject['name'] = req.body.name;
        newObject['age'] = req.body.age;
        newObject['weight'] = req.body.weight;
        newObject['height'] = req.body.height;
        newObject['medicine'] = req.body.medicine;
        insertDatabase(db, newObject);
        let result = await findDatabase(db);
        res.status(200).json(result); // sends JSON and ends response
    } catch (err) {
        console.error("Error fetching database:", err);
        res.status(500).json({ error: "Internal server error" });
    }
});

//update
//curl -X PUT -d "name=demo&age=20&userId=11111&weight=50&height=177&medicine=meds0&medicine=meds4&medicine=meds2" "localhost:8099/api/name/test"
app.put("/api/name/:name", async (req, res, next) => {
    try {
        const database = await findDatabase(db);
        database.forEach((object) => {
            if (object.name == req.params.name) {
                updateDatabase(db, req.params.name, req.body.name, req.body.age, req.body.weight, req.body.height, req.body.medicine, req.body.userId,);
            }
        })
        const result = await findDatabase(db);
        res.status(200).type("json").json(result);
    } catch (err) {
        console.error("Error fetching database:", err);
        res.status(500).json({ error: "Internal server error" });

    }
})

//delete
//curl -X DELETE "localhost:8099/api/delete/name/demo"
app.delete("/api/delete/name/:name", async (req, res, next) => {
    try {
        const database = await findDatabase(db);
        database.forEach((object) => {
            if (object.name == req.params.name) {
                deleteDatabase(db, req.params.name);
            }
        })
        const result = await findDatabase(db);
        res.status(200).type("json").json(result);
    } catch (err) {
        console.error("Error fetching database:", err);
        res.status(500).json({ error: "Internal server error" });

    }
})

//port
app.listen(process.env.PORT || 8099);