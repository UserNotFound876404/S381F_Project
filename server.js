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
const updateDatabase = async (db, oldUserId, newName, age, weight, height, meds, userId, gender) => {
    var collection = db.collection(collectionName);
    collection.updateMany({ 'userId': oldUserId }, { $set: { 'name': newName, 'weight': weight, 'height': height, 'medicine': meds, 'userId': userId, 'age': age ,'gender':gender} });
}

//delete mongodb
const deleteDatabase = async (db, userId) => {
    var collection = db.collection(collectionName);
    collection.deleteOne({ "userId": userId });
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

app.get('/signup',(req,res,next)=>{
    res.status(200).render('signup');
})
app.post('/signup',(req,res,next)=>{
    let newAccount = {};
    newAccount['name']= req.body.name;
    newAccount['password']=req.body.password;
    users.push(newAccount);
    res.redirect("login");
});

//insert
app.get('/insert', (req, res, next) => {
    res.status(200).render('insert');
})
app.post("/insert", async (req, res, next) => {
    const db = client.db(dbName);
    try {
        let newObject = {};
        newObject['userId'] = req.body.userId;
        newObject['name'] = req.body.name;
        newObject['age'] = req.body.age;
        newObject['weight'] = req.body.weight;
        newObject['height'] = req.body.height;
        newObject['medicine'] = req.body.medicine;
        newObject['gender'] = req.body.gender;
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
});
app.post("/update", async (req, res, next) => {
    const db = client.db(dbName);
    try {
        updateDatabase(db, req.body.olduserId, req.body.name, req.body.age, req.body.weight, req.body.height, req.body.medicine, req.body.userId,req.body.gender);
        res.status(200).redirect("success");
    } catch (err) {
        console.error("Error fetching database:", err);
        res.status(500).json({ error: "Internal server error" });
    }
});

//delete
app.get('/delete', (req, res, next) => {
    res.status(200).render('delete');
});
app.post('/delete',(req,res,next)=>{
    const db = client.db(dbName); 
    try{
        deleteDatabase(db,req.body.userId);
        res.status(200).redirect("success");
    }
    catch (err){
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

app.get('/about',(req,res,next)=>{
    res.status(200).render("about");
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
            const db = client.db(dbName);
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
        const db = client.db(dbName);
        const result = await findDatabase(db); // await the helper
        res.status(200).json(result); // sends JSON and ends response
    } catch (err) {
        console.error("Error fetching database:", err);
        res.status(500).json({ error: "Internal server error" });
    }
});

//insert
//curl -X POST -d "name=test&age=40&userId=22222&weight=76&height=177&medicine=meds0&medicine=meds4&gender=Male" "localhost:8099/api"
app.post("/api", async (req, res, next) => {
    try {
        let newObject = {};
        newObject['userId'] = req.body.userId;
        newObject['name'] = req.body.name;
        newObject['age'] = req.body.age;
        newObject['weight'] = req.body.weight;
        newObject['height'] = req.body.height;
        newObject['medicine'] = req.body.medicine;
        newObject['gender'] = req.body.gender;
        const db = client.db(dbName);
        await insertDatabase(db, newObject);
        res.status(200).send("Data inserted"); // sends JSON and ends response
    } catch (err) {
        console.error("Error fetching database:", err);
        res.status(500).json({ error: "Internal server error" });
    }
});

//update
//curl -X PUT -d "name=demo&age=20&userId=11111&weight=50&height=177&medicine=meds0&medicine=meds4&medicine=meds2&gender=Male" "localhost:8099/api/userId/22222"
app.put("/api/userId/:userId", async (req, res, next) => {
    try {
        const db = client.db(dbName);
        const database = await findDatabase(db);
        database.forEach((object) => {
            if (object.userId == req.params.userId) {
                updateDatabase(db, req.params.userId, req.body.name, req.body.age, req.body.weight, req.body.height, req.body.medicine, req.body.userId, req.body.gender);
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
//curl -X DELETE "localhost:8099/api/delete/userId/11111"
app.delete("/api/delete/userId/:userId", async (req, res, next) => {
    try {
        const db = client.db(dbName);
        const database = await findDatabase(db);
        database.forEach((object) => {
            if (object.userId == req.params.userId) {
                deleteDatabase(db, req.params.userId);
            }
        })
        res.status(200).type("json").send("Data deleted");
    } catch (err) {
        console.error("Error fetching database:", err);
        res.status(500).json({ error: "Internal server error" });

    }
})

//port
app.listen(process.env.PORT || 8099);
