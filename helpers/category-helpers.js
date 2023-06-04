const { ObjectId } = require('mongodb');
const db = require('../config/connection');
const collection = require('../config/collections');

module.exports = {

// UNLIST PRODUCTS BY CATEGORY
unlistProductsByCategory: (categoryId) => {
    return new Promise((resolve, reject) => {
      db.get()
        .collection(collection.PRODUCT_COLLECTION)
        .updateMany(
          { Category: categoryId },
          { $set: { Listed: false } }
        )
        .then(() => {
          resolve();
        })
        .catch((err) => {
          reject(err);
        });
    });
  },
  
  // LIST PRODUCTS BY CATEGORY
  listProductsByCategory: (categoryId) => {
    return new Promise((resolve, reject) => {
      db.get()
        .collection(collection.PRODUCT_COLLECTION)
        .updateMany(
          { Category: categoryId },
          { $set: { Listed: true } }
        )
        .then(() => {
          resolve();
        })
        .catch((err) => {
          reject(err);
        });
    });
  },
  

};
