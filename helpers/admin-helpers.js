var db=require("../config/connection");
var collection=require("../config/collections");
var objectId = require('mongodb').ObjectID
const bcrypt=require('bcrypt');
const { response } = require("express");
const collections = require("../config/collections");
var objectId=require("mongodb").ObjectId;
const { ObjectId } = require("mongodb");
const { resolve, reject } = require("promise");
module.exports = {
  //ADMIN LOGIN
    doLogin: function(adminData) {
        return new Promise(async function(resolve, reject) {
            let loginStatus = false;
            let response = {};
            let admin = await db.get().collection(collection.ADMIN_COLLECTION).findOne({ email: adminData.email });
            if (admin) {
                bcrypt.compare(adminData.password, admin.password).then((status) => {
                    if (status) {
                        console.log("Login Success");
                        response.admin = admin;
                        response.status = true;
                        console.log("Responce contains: " + response);
                        resolve(response);
                    } else {
                        console.log("Login Failed");
                        resolve({ status: false });
                    }
                });
            } else {
                console.log("Login Failed user does not exist");
                resolve({ status: false });
            }
        });
    },
    //GET ALL USERS
    getAllUsers:(user)=>{
        return new Promise(async(resolve,reject)=>{
            let users=await db.get().collection(collection.USER_COLLECTION).find({}).toArray()
            resolve(users)
        })
    },




    getUserOrders: () => {
      return new Promise(async (resolve, reject) => {
        try {
          const orders = await db
            .get()
            .collection(collection.ORDER_COLLCETION)
            .find({})
            .toArray();
          resolve(orders);
        } catch (error) {
          reject(error);
        }
      });
    },


    // ORGINAL CODE FOR GET SALES DATA
    getOrdersByToday: () => {
      return new Promise(async (resolve, reject) => {
        try {
          const today = new Date();
          const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
          const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59);
    
          const orders = await db
            .get()
            .collection(collection.ORDER_COLLCETION)
            .find({ date: { $gte: startOfDay, $lte: endOfDay } })
            .toArray();
    
          resolve(orders);
        } catch (error) {
          reject(error);
        }
      });
    },
    
    getOrdersByWeek: () => {
      return new Promise(async (resolve, reject) => {
        try {
          const today = new Date();
          const startOfWeek = new Date(today.getFullYear(), today.getMonth(), today.getDate() - today.getDay());
          const endOfWeek = new Date(today.getFullYear(), today.getMonth(), today.getDate() + (6 - today.getDay()), 23, 59, 59);
    
          const orders = await db
            .get()
            .collection(collection.ORDER_COLLCETION)
            .find({ date: { $gte: startOfWeek, $lte: endOfWeek } })
            .toArray();
    
          resolve(orders);
        } catch (error) {
          reject(error);
        }
      });
    },
    
    getOrdersByMonth: () => {
      return new Promise(async (resolve, reject) => {
        try {
          const today = new Date();
          const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
          const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0, 23, 59, 59);
    
          const orders = await db
            .get()
            .collection(collection.ORDER_COLLCETION)
            .find({ date: { $gte: startOfMonth, $lte: endOfMonth } })
            .toArray();
    
          resolve(orders);
        } catch (error) {
          reject(error);
        }
      });
    },
    
    getOrdersByYear: () => {
      return new Promise(async (resolve, reject) => {
        try {
          const today = new Date();
          const startOfYear = new Date(today.getFullYear(), 0, 1);
          const endOfYear = new Date(today.getFullYear(), 11, 31, 23, 59, 59);
    
          const orders = await db
            .get()
            .collection(collection.ORDER_COLLCETION)
            .find({ date: { $gte: startOfYear, $lte: endOfYear } })
            .toArray();
    
          resolve(orders);
        } catch (error) {
          reject(error);
        }
      });
    },
    


   //GET USER ORDER PRODUCTS
    getUserOrderProducts:(orderId)=>{
        return new Promise(async(resolve,reject)=>{
            let orderItems=await db.get().collection(collection.ORDER_COLLCETION).aggregate([
                {
                    $match:{_id:ObjectId(orderId)}
                },
      
                {
                    $unwind:'$products'
                },
                {
                    $project:{
                        item:'$products.item',
                        quantity:'$products.quantity'
                    }
                },
                {
                    $lookup:{
                        from:collection.PRODUCT_COLLECTION,
                        localField:'item',
                        foreignField:'_id',
                        as:"product"
                    }
                },
                {
                    $project:{
                        item:1,quantity:1,product:{$arrayElemAt:['$product',0]}
                    }
                }
      
            ]).toArray()
            console.log("<<<<<<<<<<<<<"+orderItems);
            resolve(orderItems)
         })
      },

      // REMOVE ORDER
      removeOrder: (orderId) => {
        return new Promise((resolve, reject) => {
          db.get()
            .collection(collection.ORDER_COLLCETION)
            .deleteOne({ _id: ObjectId(orderId) })
            .then(() => {
              resolve();
            })
            .catch((error) => {
              reject(error);
            });
        });
      },

//GET ALL CATEGORY

  getAllCategories: () => {
    return new Promise((resolve, reject) => {
      db.get()
        .collection(collection.CATEGORY_MANAGEMENT)
        .find({})
        .toArray((err, categories) => {
          if (err) {
            reject(err);
          } else {
            resolve(categories);
          }
        });
    });
  },

//BLOCK USER IN  ADMIN SIDE
blockUser: (userId) => {
    return new Promise(async (resolve, reject) => {
      await db
        .get()
        .collection(collection.USER_COLLECTION)
        .updateOne(
          { _id: ObjectId(userId) },
          { $set: { isBlocked: true } }
        );
      resolve();
    });
  },
  

  //UNBLOCK USER
  unblockUser: (userId) => {
    return new Promise(async (resolve, reject) => {
      await db
        .get()
        .collection(collection.USER_COLLECTION)
        .updateOne(
          { _id: ObjectId(userId) },
          { $set: { isBlocked: false } }
        );
      resolve();
    });
  },
  



//TESTING PIE CHART

getCashOrderAmount: () => {
  return new Promise((resolve, reject) => {
    db.get()
      .collection(collection.ORDER_COLLCETION)
      .find({ paymentMethod: 'COD' })
      .toArray((error, cashOrders) => {
        if (error) {
          reject(error);
        } else {
          let cashAmount = 0;
          cashOrders.forEach(order => {
            cashAmount += order.totalAmount;
          });
          resolve(cashAmount);
        }
      });
  });
},

// Helper function to fetch online payment amount from orders
getOnlineOrderAmount: () => {
  return new Promise((resolve, reject) => {
    db.get()
      .collection(collection.ORDER_COLLCETION)
      .find({ paymentMethod: 'ONLINE' })
      .toArray((error, onlineOrders) => {
        if (error) {
          reject(error);
        } else {
          let onlineAmount = 0;
          onlineOrders.forEach(order => {
            onlineAmount += order.totalAmount;
          });
          resolve(onlineAmount);
        }
      });
  });
},
// Helper methods
getYesterdayRevenue : () => {
  return new Promise(async (resolve, reject) => {
    try {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const startOfDay = new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate());
      const endOfDay = new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate(), 23, 59, 59);

      const orders = await db
        .get()
        .collection(collection.ORDER_COLLCETION)
        .find({ date: { $gte: startOfDay, $lte: endOfDay } })
        .toArray();

      let yesterdayRevenue = 0;
      orders.forEach(order => {
        yesterdayRevenue += order.totalAmount;
      });

      resolve(yesterdayRevenue);
    } catch (error) {
      reject(error);
    }
  });
},

 getTodayRevenue : () => {
  return new Promise(async (resolve, reject) => {
    try {
      const today = new Date();
      const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59);

      const orders = await db
        .get()
        .collection(collection.ORDER_COLLCETION)
        .find({ date: { $gte: startOfDay, $lte: endOfDay } })
        .toArray();

      let todayRevenue = 0;
      orders.forEach(order => {
        todayRevenue += order.totalAmount;
      });

      resolve(todayRevenue);
    } catch (error) {
      reject(error);
    }
  });
},

 //ADD CATEGORY
 addBanner:(banner,callback)=>{
  console.log(banner);
  db.get().collection('banner').insertOne(banner).then((data)=>{
      callback(data.insertedId)
  })
},

getBanners:()=>{
     return new Promise(async(resolve,reject)=>{
      let banner = await db.get().collection(collection.BANNER_COLLECTION).find().toArray()
        resolve(banner)
     })
  },
  getThisUser: (orderId) => {
    return new Promise(async (resolve, reject) => {
      try {
        let order = await db.get().collection(collection.ORDER_COLLCETION).findOne({ _id: ObjectId(orderId) });
        let userId = order.userId.toString(); // Convert userId to string
        let user = await db.get().collection(collection.USER_COLLECTION).findOne({ _id: ObjectId(userId) });
        resolve(user);
      } catch (error) {
        reject(error);
      }
    });
  },


  
  updateStatus: (orderId, status) => {
  return new Promise((resolve, reject) => {
    db.get().collection(collection.ORDER_COLLCETION).updateOne(
      { _id: ObjectId(orderId) },
      { $set: { status: status } },
      (err, response) => {
        if (err) {
          reject(err);
        } else {
          resolve(response);
        }
      }
    );
  });
},

getCategoryByName: (categoryName) => {
  return new Promise((resolve, reject) => {
    db.get()
      .collection(collection.CATEGORY_MANAGEMENT)
      .findOne({ Name: categoryName })
      .then((category) => {
        resolve(category);
      })
      .catch((error) => {
        reject(error);
      });
  });
},

addCoupon: (couponDetails) => {
  return new Promise((resolve, reject) => {
    couponDetails.offer = parseInt(couponDetails.offer);
    couponDetails.minPurchase = parseInt(couponDetails.minPurchase);

    db.get()
      .collection(collection.COUPON_COLLECTION)
      .insertOne(couponDetails)
      .then((response) => {
        resolve(response);
      })
      .catch((error) => {
        reject(error);
      });
  });
}
,
// Helper method to get all coupons
getAllCoupons: () => {
  return new Promise((resolve, reject) => {
    db.get()
      .collection(collection.COUPON_COLLECTION)
      .find({})
      .toArray((err, coupons) => {
        if (err) {
          reject(err);
        } else {
          resolve(coupons);
        }
      });
  });
}




  
  



};