const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const path = require('path');
const multer = require('multer')
const upload = multer({dest:"public/uploads"});

const API = require('./src/api')
const accountsManager = require('./src/contollers/users');
const postManager = require('./src/contollers/post');
const commentManager = require('./src/contollers/comments')
const sanitizer = require('./src/contollers/sanitizer');
const config = require('./src/config/config');
const session = require('./src/models/session');

const port = config.PORT;

var currentSession = new session.SessionManager();

app.set('view engine', 'ejs');
app.use('/uploads', express.static(path.join(__dirname, 'public/uploads')));
app.use(express.static(__dirname + '/public/css'));
app.use(bodyParser.json());
app.use(cookieParser());
app.use(
  bodyParser.urlencoded({
    extended: true,
  }),
);

app.listen(port, () => {
  console.log(`listening on port ${port}`);
})

app.get('/?', async (req, res) => {
  var page = req.query.page;

  if (page == undefined || page > config.MAX_PAGE_COUNT){ page = 1};

  const newPosts = await postManager.getNewPosts(config.POST_PAGE_SIZE, page);

  const minPage = parseInt(page / config.PAGE_BAR_SIZE) * config.PAGE_BAR_SIZE + 1;

  res.render('index', {login: req.cookies.user, newPosts: newPosts, minPage: minPage, pageCount: config.PAGE_BAR_SIZE});
})

app.get('/user', async (req, res) => {
  let userLogin = req.query.user;
  let user = await accountsManager.findUser(userLogin);
  let posts = await postManager.getUserPosts(userLogin, 10);

  if (user){
    return res.render('user', {user: user.login, date: user.date, newPosts: posts, login: req.cookies.user, about: user.info, avatar: user.image});
  }
  res.sendFile(path.join(__dirname, 'public/error.html'));
})

app.get('/signUp', (req, res) => {
  res.sendFile(path.join(__dirname, 'public/signUp.html'));
})

app.get('/signIn', (req, res) => {
  res.sendFile(path.join(__dirname, 'public/signIn.html'));
})

app.get('/logout', (req, res) => {
  currentSession.destroy(req.cookies.session, req, res);
  res.redirect('/');
})

app.get('/search', async (req, res) => {
  var page = req.query.page;

  if (page == undefined || page > config.MAX_PAGE_COUNT){ page = 1};

  let data = req.query.data;
  let result = await postManager.searchPost(data);

  const minPage = parseInt(page / config.PAGE_BAR_SIZE) * config.PAGE_BAR_SIZE + 1;

  res.render('index', {login: req.cookies.user, newPosts: result, minPage: minPage, pageCount: config.PAGE_BAR_SIZE});
})

app.get('/searchByTag', async (req, res) => {
  let tag = req.query.tag;
  let page = req.query.page;

  if (page == undefined || page > config.MAX_PAGE_COUNT){ page = 1};

  let minPage = parseInt(page / config.PAGE_BAR_SIZE) * config.PAGE_BAR_SIZE + 1;

  let result = await postManager.searchByTag(tag, config.POST_PAGE_SIZE, page);

  res.render('index', {login: req.cookies.user, newPosts: result,  minPage: minPage, pageCount: config.PAGE_BAR_SIZE});
})

app.get('/post', (req, res) => {
  res.render('createPost', {title: '', data: '', id: '', action: 'createPost'});
})

app.get('/editPost', async (req, res) => {
  const currentPost = await postManager.getPostByid(req.query.id);
  res.render('createPost', {title: currentPost.name, data: currentPost.data, id: currentPost.id, action: 'updatePost'});
})

app.post('/createPost', async (req, res) => {
  const title = req.body.head;
  const text = sanitizer.AntiXML.checkHTML(req.body.data);
  const tags = req.body.tags;
  const author = req.cookies.user;

  const isSpam = await sanitizer.AntiSpam.checkPost(req, 0);

  if (isSpam || !currentSession.checkUser(req, res)){
    return res.sendFile(path.join(__dirname, 'public/error.html'));
  }

  const postId = await postManager.createPost(title, text, author, tags);

  res.cookie('userPost', {maxAge: config.COOKIES_AGE, httpOnly: true, postId: postId, postTime: API.Time.getDateInSeconds()})
  res.send(200);
})

app.post('/updatePost', (req, res) => {
  const id = req.query.id;
  const title = req.body.head;
  const text = sanitizer.AntiXML.checkHTML(req.body.data);
  const tags = req.body.tags;
  const author = req.cookies.user;

  if (!currentSession.checkUser(req, res)){
    return res.sendFile(path.join(__dirname, 'public/error.html'));
  }

  postManager.updatePost(id, title, text, author, tags, id)
  res.send(200);
})

app.get('/deletePost', async (req, res) => {
  const postId = req.query.id;
  const currentPost = await postManager.getPostByid(postId);

  if (currentPost && currentSession.checkUser(req, res) && currentPost.author){
    postManager.deletePost(postId);
    return res.redirect(`/user?user=${currentPost.author}`);
  }
  res.sendFile(path.join(__dirname, 'public/error.html'));
})

app.get('/read', async (req, res) => {
  const postId = req.query.id;
  const post = await postManager.getPostByid(postId);
  const comments = await commentManager.getComments(postId);
  const user = req.cookies.user
  let postRating = await accountsManager.userPostRating(user, postId);

  if (post){
    return res.render('readPost', {post: post, comments: comments, reader: user, rating: postRating});
  }
  res.sendFile(path.join(__dirname, 'public/error.html'));
})

app.post('/rate', async (req, res) => {
  const id = req.query.id;
  const value = Number(req.query.value);
  const user = req.cookies.user;

  if (!user){
    return res.redirect('back');
  }

  let postRating = await accountsManager.userPostRating(user, id);
  
  if (value != postRating){
    accountsManager.addRatedPost(user, id, value);
    postManager.rate(id, value);
  }
  
  res.redirect('back');
})

app.post('/postcomment', (req, res) => {
  const postId = req.query.postId
  const user = req.cookies.user;
  const text = req.body.commentText;

  if (!currentSession.checkUser(req, res)){
    return res.sendFile(path.join(__dirname, 'public/error.html'));
  }

  commentManager.postComment(user, text, postId);
  res.redirect('back');
})

app.post('/removecomment', (req, res) => {
  const id = req.query.id;

  if (!currentSession.checkUser(req, res)){
    return res.sendFile(path.join(__dirname, 'public/error.html'));
  }

  commentManager.removeComment(id);
  res.redirect('back');
})

app.post('/updateInfo', (req, res) => {
  const user = req.cookies.user;
  const text = req.body.text;

  accountsManager.changeInfo(user, text);
  res.redirect(301, req.get('referer'));
})

app.post('/uploadImage',upload.single('filedata'), (req, res) => {
  let login = req.cookies.user;
  let fileData = req.file;
  let fileSize = Math.floor(fileData.size / 1024);
  console.log(fileData)

  if (login && fileSize <= config.MAX_IMAGE_TO_UPLOAD_SIZE){
    accountsManager.changeImage(login, fileData.filename);
    return res.redirect(req.get('referer'));
  }
  res.sendFile(path.join(__dirname, 'public/error.html'));
})

app.post('/registration', async (req, res) => {
    const login = req.body.login;
    const pass = req.body.password;
    const user = await accountsManager.signUp(login, pass);

    if (user){
      return res.redirect("/signIn");
    }
    res.sendFile(path.join(__dirname, 'public/error.html'));
})

app.post('/login', async (req, res) => {
  const login = req.body.login;
  const pass = req.body.password;
  const user = await accountsManager.signIn(login, pass);

  if (user && !req.cookies.user){
    currentSession.create(user.login, res);
    return res.redirect("/");
  }
    res.sendFile(path.join(__dirname, 'public/error.html'));
})

app.post('/deleteUser', async (req, res) => {
  const user = req.cookies.user;

  if (!user){
    return res.sendFile(path.join(__dirname, 'public/error.html'));
  }

  await accountsManager.remove(user);
  currentSession.destroy(req.cookies.session, req, res);
  res.redirect("/");
})