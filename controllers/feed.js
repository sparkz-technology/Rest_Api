const { validationResult } = require('express-validator'); // to validate the data
const Post = require('../models/post'); // to import the post model
const clearImage = require('../util/helper'); // to delete the image fileutil

exports.getPosts = (req, res, next) => {
  const { page } = req.query || 1; // to get the page number from the query params
  const perPage = 2; // to set the number of posts per page
  let totalItems; // to store the total number of posts
  Post.find()
    .countDocuments()
    .then((count) => {
      totalItems = count;
      return Post.find()
        .skip((page - 1) * perPage)
        .limit(perPage);
    })
    .then((posts) => {
      if (!posts) {
        const error = new Error('No posts found !');
        error.statusCode = 404;
        return next(error); // throw the error
      }
      res
        .status(200)
        .json({ message: 'Fetched posts successfully', posts, totalItems });
    })
    .catch((err) => {
      if (!err.statusCode) err.statusCode = 500;
      next(err);
    });
};

exports.getPost = (req, res, next) => {
  const { postId } = req.params;
  Post.findById({ _id: postId })
    .then((post) => {
      if (!post) {
        const error = new Error('Could not find the post !');
        error.statusCode = 404;
        return next(error); // throw the error
      }
      res.status(200).json({ message: 'Post fetched', post });
    })
    .catch((err) => {
      if (!err.statusCode) err.statusCode = 500;
      next(err);
    });
};

exports.createPost = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const error = new Error('Validation failed, entered data is incorrect !');
    error.statusCode = 422;
    return next(error); // throw the error
  }
  if (!req.file) {
    const error = new Error('No image provided !');
    error.statusCode = 422;
    return next(error); // throw the error
  }

  const { title, content } = req.body;
  const imageUrl = req.file.path.replace('\\', '/');
  const post = new Post({
    title,
    content,
    imageUrl: imageUrl,
    creator: { name: 'Sparkz' },
  });
  post
    .save()
    .then((result) => {
      res.status(201).json({ message: 'Post created !', post: result });
    })
    .catch((err) => {
      if (!err.statusCode) err.statusCode = 500;
      next(err);
    });
};
exports.updatePost = (req, res, next) => {
  const { postId } = req.params;
  const { title, content } = req.body;
  let imageUrl = req.body.image;
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const error = new Error('Validation failed, entered data is incorrect !');
    error.statusCode = 422;
    return next(error); // throw the error
  }
  if (req.file) {
    imageUrl = req.file.path.replace('\\', '/');
  }
  if (!imageUrl) {
    const error = new Error('No file picked !');
    error.statusCode = 422;
    return next(error); // throw the error
  }
  Post.findById({ _id: postId })
    .then((post) => {
      if (!post) {
        const error = new Error('Could not find the post !');
        error.statusCode = 404;
        return next(error); // throw the error
      }
      if (imageUrl !== post.imageUrl) {
        clearImage(post.imageUrl, (err) => {
          if (err) {
            return next(err);
          }
        });
      }
      post.title = title;
      post.content = content;
      post.imageUrl = imageUrl;
      return post.save();
    })
    .then((result) => {
      res.status(200).json({ message: 'Post updated !', post: result });
    })
    .catch((err) => {
      if (!err.statusCode) err.statusCode = 500;
      next(err);
    });
};

exports.deletePost = (req, res, next) => {
  const { postId } = req.params;
  if (!postId) {
    const error = new Error('No post found !');
    error.statusCode = 404;
    return next(error); // throw the error
  }
  Post.findById({ _id: postId })
    .then((post) => {
      if (!post) {
        const error = new Error('Could not find the post !');
        error.statusCode = 404;
        return next(error); // throw the error
      }
      clearImage(post.imageUrl, (err) => {
        if (err) {
          return next(err);
        }
      });
      return Post.deleteOne({ _id: postId });
    })
    .then((result) => {
      res.status(200).json({ message: 'Post deleted !' });
    })
    .catch((err) => {
      if (!err.statusCode) err.statusCode = 500;
      next(err);
    });
};
