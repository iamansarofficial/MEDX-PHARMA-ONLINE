const { resolve, reject } = require('promise');
var db = require('../config/connection')
var collection=require('../config/collections')
var objectId=require('mongodb').ObjectId
var catHelpers=require('../helpers/category-helpers')

module.exports={


// ADD PRODUCT updated
addProduct: (product, callback) => {
  console.log(product);
  try {
    db.get().collection('product').insertOne(product).then((data) => {
      callback(data.insertedId);
    });
  } catch (error) {
    console.error('Error adding product:', error);
    throw new Error("An error occurred while adding the product. Please try again.");
  }
},



//ADD PAGINATION
getAllProducts: () => {
  return new Promise(async (resolve, reject) => {
    try {
      const products = await db.get().collection(collection.PRODUCT_COLLECTION).find({ Listed: true, Category: { $ne: null } }).toArray();
      resolve(products);
    } catch (error) {
      reject(error);
    }
  });
},
//ORGINAL CODE
getPaginatedProducts: (query, page, limit) => {
  return new Promise(async (resolve, reject) => {
    try {
      const collection = db.get().collection('product'); // Replace 'collection.PRODUCT_COLLECTION' with the actual collection name

      // Count total number of products matching the query
      const totalCount = await collection.countDocuments(query);

      // Get products for the requested page and limit
      const products = await collection
        .find(query)
        .skip((page - 1) * limit)
        .limit(limit)
        .toArray();

      resolve({ products, totalCount });
    } catch (error) {
      reject(error);
    }
  });
},


//TESTING
// getPaginatedProducts: (query, page, limit) => {
//   return new Promise(async (resolve, reject) => {
//     try {
//       const collection = db.get().collection('product'); // Replace 'collection.PRODUCT_COLLECTION' with the actual collection name

//       const totalCount = await collection.countDocuments(query);

//       const products = await collection
//         .aggregate([
//           { $match: query },
//           {
//             $project: {
//               _id: 1,
//               Name: 1,
//               Category: 1,
//               Price: 1,
//               Description: 1,
//               Listed: 1,
//               Quantity: {
//                 $cond: {
//                   if: { $lte: ['$Quantity', 0] },
//                   then: 0,
//                   else: '$Quantity',
//                 },
//               },
//             },
//           },
//         ])
//         .skip((page - 1) * limit)
//         .limit(limit)
//         .toArray();

//       resolve({ products, totalCount });
//     } catch (error) {
//       reject(error);
//     }
//   });
// },
//TESTING GLOBEL SEARCH:




  
  //DELETE PRODUCT
    deleteProduct:(proId)=>{
        return new Promise((resolve,reject)=>{
            db.get().collection(collection.PRODUCT_COLLECTION).deleteOne({_id:objectId(proId)}).then((response)=>{
                resolve(response)
            })
        })
    },

    //GET PRODUCTS DETAILS
    getProductDetails:function(proId){
        return new Promise(function(resolve,reject){
            db.get().collection(collection.PRODUCT_COLLECTION).findOne({_id:objectId(proId)}).then((product)=>{
                resolve(product)
            })
        })
    },

    // //UPDATE PRODUCTS
    // updateProduct:function(proId,proDetails){
    //     return new Promise((function(resolve,reject){
    //         db.get().collection(collection.PRODUCT_COLLECTION).updateOne({_id:objectId(proId)},{
    //           $set: {
    //             Name: proDetails.Name,
    //             Description: proDetails.Description,
    //             Category: proDetails.Category,
    //             Price: proDetails.Price,
    //             Quantity: proDetails.Quantity
    //         }
    //         }).then((response)=>{
    //             resolve()
    //         })
    //     }))
    // },

    updateProduct: function(proId, proDetails) {
      return new Promise((resolve, reject) => {
          const quantity = parseInt(proDetails.Quantity); // Convert Quantity to number
          db.get().collection(collection.PRODUCT_COLLECTION).updateOne(
              { _id: objectId(proId) },
              {
                  $set: {
                      Name: proDetails.Name,
                      Description: proDetails.Description,
                      Category: proDetails.Category,
                      Price: proDetails.Price,
                      Quantity: quantity // Save the converted number
                  }
              }
          ).then((response) => {
              resolve();
          });
      });
  },
  

    //GET ALL CATEGORY
    getAllCategory:()=>{
       return new Promise(async(resolve,reject)=>{
        let category = await db.get().collection(collection.CATEGORY_MANAGEMENT).find().toArray()
          resolve(category)
       })
    },
  

  //ADD CATEGORY
addCategory: (category, callback) => {
  const categoryName = category.Name;
  if (categoryName && categoryName[0] !== categoryName[0].toUpperCase()) {
    // First character is not a capital letter
    callback('Please enter the category name with the first letter as a capital letter');
  } else {
    db.get()
      .collection(collection.CATEGORY_MANAGEMENT)
      .findOne({ Name: categoryName })
      .then((result) => {
        if (result) {
          // Category name already exists
          callback('Category name already exists');
        } else {
          db.get()
            .collection(collection.CATEGORY_MANAGEMENT)
            .insertOne(category)
            .then((data) => {
              callback(null, data.insertedId);
            })
            .catch((err) => {
              callback(err);
            });
        }
      })
      .catch((err) => {
        callback(err);
      });
  }
},


//DELETE CATEGORY
    deleteCategory:(catId)=>{
        return new Promise((resolve,reject)=>{
            db.get().collection(collection.CATEGORY_MANAGEMENT).deleteOne({_id:objectId(catId)}).then((response)=>{
                resolve(response)
            })
        })
    },
    //GET CATEGORY DETAILED
    getCategoryDetails:function(catId){
        return new Promise(function(resolve,reject){
            db.get().collection(collection.CATEGORY_MANAGEMENT).findOne({_id:objectId(catId)}).then((category)=>{
                resolve(category)
            })
        })
    },
    //UPDATE CATEGORY
    updateCategory:function(catId,catDetails){
        return new Promise((function(resolve,reject){
            db.get().collection(collection.CATEGORY_MANAGEMENT).updateOne({_id:objectId(catId)},{
                $set:{
                    Name:catDetails.Name,
                    Description:catDetails.Description,
                    // Category:proDetails.Category,
                    // Price:proDetails.Price
                }
            }).then((response)=>{
                resolve()
            })
        }))
    },

    

  // UNLIST CATEGORY
unlistCategory: (categoryId) => {
    return new Promise((resolve, reject) => {
      db.get()
        .collection(collection.CATEGORY_MANAGEMENT)
        .updateOne(
          { Name: (categoryId) },
          { $set: { Listed: false } }
        )
        .then(() => {
          // Unlist related products
          catHelpers.unlistProductsByCategory(categoryId).then(() => {
            resolve();
          });
        })
        .catch((err) => {
          reject(err);
        });
    });
  },
  
  // LIST CATEGORY
  listCategory: (categoryId) => {
    return new Promise((resolve, reject) => {
      db.get()
        .collection(collection.CATEGORY_MANAGEMENT)
        .updateOne(
          { Name: (categoryId) },
          { $set: { Listed: true } }
        )
        .then(() => {
          // List related products
          catHelpers.listProductsByCategory(categoryId).then(() => {
            resolve();
          });
        })
        .catch((err) => {
          reject(err);
        });
    });
  },
   //DELETE BANNER
   deleteBanner:(bannerId)=>{
    return new Promise((resolve,reject)=>{
        db.get().collection(collection.BANNER_COLLECTION).deleteOne({_id:objectId(bannerId)}).then((response)=>{
            resolve(response)
        })
    })
},
getProducts: (query) => {
  return new Promise(async (resolve, reject) => {
    try {
      const collection = db.get().collection('product'); // Replace 'collection.PRODUCT_COLLECTION' with the actual collection name

      const products = await collection.find(query).toArray();

      resolve(products);
    } catch (error) {
      reject(error);
    }
  });
},
//  //DELETE BANNER
//  deleteCoupon:(couponId)=>{
//   return new Promise((resolve,reject)=>{
//       db.get().collection(collection.COUPON_COLLECTION).deleteOne({_id:objectId(couponId)}).then((response)=>{
//           resolve(response)
//       })
//   })
// },
}