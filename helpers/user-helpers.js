var db = require("../config/connection");
var collection = require("../config/collections");
var objectId = require("mongodb").ObjectID;
const bcrypt = require("bcrypt");
const { response } = require("express");
const collections = require("../config/collections");
var objectId = require("mongodb").ObjectId;
const { ObjectId } = require("mongodb");
const crypto = require("node:crypto");
const nodemailer = require("nodemailer");
const { resolve } = require("node:path");
const { reject } = require("promise");
var Razorpay=require('razorpay')


//CERATE INSTANCE
var instance = new Razorpay({
  key_id:'rzp_test_i8bRHxqtJvHhyp',
  key_secret:'47qHT4Xhk4vIiIQxRtsS4o40',
})

// //GET RANDOM VARIFYING TOKEN FOR SENDING USER ORGINAL
function getRandomVerificationToken() {
  return new Promise((resolve, reject) => {
    crypto.randomBytes(4, (err, buffer) => {
      if (err) {
        reject(err);
        return;
      }
      resolve(buffer.toString("hex"));
    });
  });
}



//CERATE TEST ACCOUNT 

let transporter;

const createTestAccount = async () => {
  // testAccount = await nodemailer.createTestAccount();
  transporter = nodemailer.createTransport({
    host: "smtp.elasticemail.com",
    port: 2525,
    secure: false, // true for 465, false for other ports
    auth: {
      user: "anzarimuhammedanzarimuhammed@gmail.com", // generated ethereal user
      pass: "5526035369A73DB7A02FA668A4B51DAC3FFC", // generated ethereal password
    },
  });
};

async function sendVerificationEmail(emailId, token) {
  await createTestAccount();
  let info = await transporter.sendMail({
    from: "anzarimuhammedanzarimuhammed@gmail.com", // sender address
     to:"masurpytospksl@bugfoo.com",
    // to: "ofpcuxrrkmmzjvw@bugfoo.com", // list of receivers

    // to: emailId,

    subject: "Verification Email", // Subject line
    text: "Verification token: " + token + "Email: " + emailId, // plain text body
    html:
      "<b>Verification token: </b><br><br> " +
      token +
      "<br><br>Email<br><br>" +
      emailId, // html body
  });
  return info;
}

module.exports = {

  

//CHECKING PASSWORD STRENGTH orginal
doSignup: (userData) => {
  return new Promise(async (resolve, reject) => {
    userData.isVerified = false;

    try {
      const password = userData.password;
      if (password.length < 8) {
        throw new Error("Password must be at least 8 characters long");
      }

      userData.password = await bcrypt.hash(password, 10);
      const verificationToken = await getRandomVerificationToken();
      userData.verificationToken = verificationToken;

         // Check if the email already exists
         const existingUser = await db.get().collection(collection.USER_COLLECTION).findOne({ email: userData.email });
         if (existingUser) {
         throw new Error("Email address is already in use");
          }


      db.get()
        .collection(collection.USER_COLLECTION)
        .insertOne(userData)
        .then(async (data) => {
          userData._id = data.insertedId;
          await sendVerificationEmail(userData.email, userData.verificationToken);
          console.log("email sent");
          resolve(userData);
        });
    } catch (error) {
      reject(error);
    }
  });
},

//ALREADY RESENTING WORKING CODE HIDE FOR UPDATING
// resendOtp: (email) => {
//   return new Promise(async (resolve, reject) => {
//     try {
//       const verificationToken = await getRandomVerificationToken();

//       // Update the user document with the new verification token
//       await db.get().collection(collection.USER_COLLECTION).updateOne(
//         { email: email },
//         { $set: { verificationToken: verificationToken } }
//       );

//       // Send the verification email with the new token
//       await sendVerificationEmail(email, verificationToken);

//       resolve();
//     } catch (error) {
//       reject(error);
//     }
//   });
// },

resendOtp: (email) => {
  return new Promise(async (resolve, reject) => {
    try {
      const verificationToken = await getRandomVerificationToken();
      // Update the user document with the new verification token
      await db.get().collection(collection.USER_COLLECTION).updateOne(
        { email: email },
        { $set: { verificationToken: verificationToken } }
      );
      // Send the verification email with the new token
      await sendVerificationEmail(email, verificationToken);
      resolve();
    } catch (error) {
      reject(error);
    }
  });
},




  doLogin: (userData) => {
    return new Promise(async (resolve, reject) => {
      let loginStatus = false;
      let response = {};
      let user = await db
        .get()
        .collection(collection.USER_COLLECTION)
        .findOne({ email: userData.email });
  
      if (user) {
        if (user.isBlocked) {
          // User is blocked
          response.status = false;
          response.error = 'Your account has been blocked. Please contact the administrator.';
          resolve(response);
        } else {
          bcrypt.compare(userData.password, user.password).then((status) => {
            if (status) {
              response.user = user;
              response.status = true;
              resolve(response);
            } else {
              response.status = false;
              response.error = 'Invalid email or password.';
              resolve(response);
            }
          });
        }
      } else {
        response.status = false;
        response.error = 'Invalid email or password.';
        resolve(response);
      }
    });
  }
  

  
  
  ,

  //ADD TO CART HELPER METHOD 
  addToCart:(proId,userId)=>{
    let proObj={
        item:ObjectId(proId),
        quantity:1
    }
    return new Promise(async(resolve,reject)=>{
        let userCart=await db.get().collection(collection.CART_COLLECTION).findOne({user:ObjectId(userId)})
        if(userCart){
            let proExist=userCart.products.findIndex(product=>product.item==proId)
            if(proExist!=-1){
                db.get().collection(collection.CART_COLLECTION).updateOne({user:ObjectId(userId),'products.item':ObjectId(proId)},
                {
                    $inc:{'products.$.quantity':1}
                }
                ).then(()=>{
                    resolve()
                })
            }else{
            db.get().collection(collection.CART_COLLECTION).updateOne({user:ObjectId(userId)},
            {
                
                    $push:{products:proObj}
               
            }
            ).then((response)=>{
             resolve()
            })
            }
        }
        else{
            let cartObj={
                user:ObjectId(userId),
                products:[proObj]
            }
            db.get().collection(collection.CART_COLLECTION).insertOne(cartObj).then((response)=>{
                resolve()
            })
        }
    })
},

// //CHANGE PRODUCT QAUNTITY HELPER METHOD
// changeProductQuantity:(details)=>{
//   details.count=parseInt(details.count)
//   details.quantity=parseInt(details.quantity)
//   console.log("hello");
//   console.log(details);
//   console.log("hai");
//   return new Promise((resolve,reject)=>{
//       if(details.count==-1 && details.quantity==1){
//           db.get().collection(collection.CART_COLLECTION).updateOne({_id:ObjectId(details.cart)},
//           {
//               $pull:{products:{item:ObjectId(details.product)}}
//           }
//           ).then((response)=>{
//               resolve({removeProduct:true})
//           })
          
//       }else{
//           db.get().collection(collection.CART_COLLECTION).updateOne({_id:ObjectId(details.cart),'products.item':ObjectId(details.product)},
//               {
//                   $inc:{'products.$.quantity':details.count}
//               }
//               ).then((response)=>{
//                   resolve({status:true})
//               })
      
//       }
      
//   })
// },
changeProductQuantity: (details) => {
  details.count = parseInt(details.count);
  details.quantity = parseInt(details.quantity);

  return new Promise((resolve, reject) => {
    if (details.count === -1 && details.quantity === 1) {
      // Remove the product from the cart if count is -1 and quantity is 1
      db.get().collection(collection.CART_COLLECTION).updateOne(
        { _id: ObjectId(details.cart) },
        { $pull: { products: { item: ObjectId(details.product) } } }
      ).then((response) => {
        resolve({ removeProduct: true });
      });
    } else {
      // Fetch the available quantity for the product
      db.get().collection(collection.PRODUCT_COLLECTION).findOne(
        { _id: ObjectId(details.product) },
        { Quantity: 1 }
      ).then((product) => {
        const availableQuantity = product.Quantity;
        if (details.quantity + details.count <= availableQuantity) {
          db.get().collection(collection.CART_COLLECTION).updateOne(
            { _id: ObjectId(details.cart), 'products.item': ObjectId(details.product) },
            { $inc: { 'products.$.quantity': details.count } }
          ).then((response) => {
            resolve({ status: true });
          });
        } else {
          resolve({ status: false, error: 'Quantity exceeds available stock' });
        }
      }).catch((error) => {
        reject(error);
      });
    }
  });
}
,

//REMOVE FROM CART HELPER METHOD
removeFromCart: (details) => {
  return new Promise((resolve, reject) => {
    db.get().collection(collection.CART_COLLECTION).updateOne(
      { _id: ObjectId(details.cart) },
      { $pull: { products: { item: ObjectId(details.product) } } }
    ).then((response) => {
      resolve({ removeProduct: true });
    }).catch((error) => {
      reject(error);
    });
  });
},

//GET PRODUCTS HELPER METHOD
getProduct:(proId)=>{
    return new Promise(async(resolve,reject)=>{
        let product=await db.get().collection(collection.PRODUCT_COLLECTION).findOne({'_id':ObjectId(proId)})
     resolve(product)
    })
},



//GET CART COUNT HELPER METHOD
    getCartCount:(userId)=>{
        return new Promise(async(resolve,reject)=>{
            let count=0
            let cart=await db.get().collection(collection.CART_COLLECTION).findOne({user:ObjectId(userId)})
            if(cart){
                count=cart.products.length
            }
            resolve(count)
        })
    },

//GET TOTAL AMOUNT HELPER METHOD
  getTotalAmount: async (userId) => {
      try {
        let total = await db.get().collection(collection.CART_COLLECTION).aggregate([
          { $match: { user: ObjectId(userId) } },
          { $unwind: '$products' },
          {
            $project: {
              item: '$products.item',
              quantity: '$products.quantity',
            },
          },
          {
            $lookup: {
              from: collection.PRODUCT_COLLECTION,
              localField: 'item',
              foreignField: '_id',
              as: 'product',
            },
          },
          {
            $project: {
              item: 1,
              quantity: 1,
              product: { $arrayElemAt: ['$product', 0] },
            },
          },
          {
            $group: {
              _id: null,
              total: { $sum: { $multiply: ['$quantity', { $toDouble: '$product.Price' }] } },

            },
          },
        ]).toArray();
    
        if (total && total.length > 0 && total[0].total !== undefined) {
          console.log('total--------------' + total[0].total);
          return total[0].total;
        } else {
          return 0;
        }
      } catch (error) {
        console.log(error);
        throw error;
      }
    },

 
//GET TOTAL ITEM HELPER METHOD
getCartProducts: async (userId) => {
  try {
    let cartItems = await db.get().collection(collection.CART_COLLECTION).aggregate([
      {
        $match: { user: ObjectId(userId) },
      },
      {
        $unwind: '$products',
      },
      {
        $project: {
          item: '$products.item',
          quantity: '$products.quantity',
        },
      },
      {
        $lookup: {
          from: collection.PRODUCT_COLLECTION,
          localField: 'item',
          foreignField: '_id',
          as: 'product',
        },
      },
      {
        $project: {
          item: 1,
          quantity: 1,
          product: { $arrayElemAt: ['$product', 0] },
        },
      },
    ]).toArray();
    return cartItems;
  } catch (error) {
    console.log(error);
    throw error;
  }
},
 


//ORDER PRODUCTS HELPER METHOD
getCartProductsList:(userId)=>{
    return new Promise(async(resolve,reject)=>{
      let cart=await db.get().collection(collection.CART_COLLECTION).findOne({user:ObjectId(userId)})
      console.log("products=================="+cart.products);
      resolve(cart.products)
    })
},

// //PLACING ORDER HELPER METHOD ORGINAL
// placeOrder:(order,products,total)=>{
//   return new Promise((resolve,response)=>{
//     console.log(products);
//       let status=order['payment-method']==='COD'?'placed':'pending'
//       let orderObj={
//           deliveryDetails:{
//               mobile:order.mobile,
//               address:order.address,
//               pincode:order.pincode
//           },
//           userId:ObjectId(order.userId),
//           paymentMethod:order['payment-method'],
//           products:products,
//           totalAmount:total,
//           status:status,
//           date:new Date()
//       }

//       db.get().collection(collection.ORDER_COLLCETION).insertOne(orderObj).then((response)=>{
//           db.get().collection(collection.CART_COLLECTION).deleteOne({user:ObjectId(order.userId)})
//           resolve(response.insertedId)
//       })
//   })
// },

placeOrder: (order, products, total) => {
  return new Promise((resolve, reject) => {
    let status = order['payment-method'] === 'COD' ? 'placed' : 'pending';

    let orderObj = {
      deliveryDetails: {
        mobile: order.mobile,
        address: order.address,
        pincode: order.pincode
      },
      userId: ObjectId(order.userId),
      paymentMethod: order['payment-method'],
      products: products,
      totalAmount: total,
      status: status,
      date: new Date()
    };

    db.get()
      .collection(collection.ORDER_COLLCETION)
      .insertOne(orderObj)
      .then((response) => {
        let orderId = response.insertedId;

        // Update product quantities
        let updatePromises = products.map((product) => {
          return new Promise((resolve, reject) => {
            let productId = ObjectId(product.item);
            let purchasedQuantity = product.quantity;

            db.get()
              .collection(collection.PRODUCT_COLLECTION)
              .findOneAndUpdate(
                { _id: productId },
                { $inc: { Quantity: -purchasedQuantity } }
              )
              .then(() => {
                console.log(`Updating product ${productId} quantity by ${purchasedQuantity}`);
                resolve();
              })
              .catch((error) => {
                reject(error);
              });
          });
        });

        Promise.all(updatePromises)
          .then(() => {
            // Clear the user's cart
            db.get()
              .collection(collection.CART_COLLECTION)
              .deleteOne({ user: ObjectId(order.userId) })
              .then(() => {
                resolve(orderId);
              })
              .catch((error) => {
                reject(error);
              });
          })
          .catch((error) => {
            reject(error);
          });
      })
      .catch((error) => {
        reject(error);
      });
  });
}
,

//GET USERS ORDER HELPER METHOD
getUserOrders: (userId) => {
  return new Promise(async (resolve, reject) => {
    try {
      const orders = await db
        .get()
        .collection(collection.ORDER_COLLCETION)
        .find({ userId: ObjectId(userId) })
        .toArray();
      resolve(orders);
    } catch (error) {
      reject(error);
    }
  });
}

,

//GET ORDER PRODUCTS HELPER METHOD
getOrderProducts:(orderId)=>{
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

//UPDATING PASSWORD HELPER METHOD
doUpdatePassword: (userId, newPassword) => {
  return new Promise(async (resolve, reject) => {
    try {
      console.log(newPassword);
      const hashedPassword = await bcrypt.hash(newPassword, 10);


      await db
        .get()
        .collection(collection.USER_COLLECTION)
        .updateOne({ _id: ObjectId(userId) }, { $set: { password: hashedPassword } });

      resolve();
    } catch (error) {
      reject(error);
    }
  });
},


//GET USER EMAIL HELPER METHOD
getUserByEmail: (email) => {
  return new Promise(async (resolve, reject) => {
    try {
      const user = await db.get().collection(collection.USER_COLLECTION).findOne({ email });
      resolve(user);
    } catch (error) {
      reject(error);
    }
  });
},




// REMOVE ORDER HELPER METHOD
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

//PAYMENT BY ONLINE
generateRazorpay: (orderId, total) => {
  return new Promise((resolve, reject) => {
    var options = {
      amount: total * 100, // amount in the smallest currency unit
      currency: "INR",
      receipt: "" + orderId
    };
    instance.orders.create(options, function (err, order) {
      if (err) {
        console.log(err);
        reject(err);
      } else {
        console.log(order);
        resolve(order);
      }
    });
  });
},



verifyPayment: (details) => {
  return new Promise((resolve, reject) => {
    let hmac = crypto.createHmac('sha256', '47qHT4Xhk4vIiIQxRtsS4o40');
    hmac.update(
      details['payment[razorpay_order_id]'] + '|' + details['payment[razorpay_payment_id]']
    );
    hmac = hmac.digest('hex');
    if (hmac === details['payment[razorpay_signature]']) {
      resolve();
    } else {
      reject();
    }
  });
},


//CHANGING PAYMENT STATUS HELPER METHOD
changePaymentStatus:(orderId)=>{
  return new Promise((resolve,reject)=>{
      db.get().collection(collection.ORDER_COLLCETION).updateOne({_id:ObjectId(orderId)},
      {
          $set:{
              status:'placed'
          }
      }
      
      ).then(()=>{
          resolve()
      })
  })
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

getBanners: () => {
  return new Promise(async (resolve, reject) => {
    let banners = await db.get().collection(collection.BANNER_COLLECTION).find().toArray();
    resolve(banners);
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
addUserAddress: (addressData) => {
  return new Promise((resolve, reject) => {
    db.get().collection(collection.ORDER_ADDRESS_COLLECTION).insertOne(addressData, (err, response) => {
      if (err) {
        reject(err);
      } else {
        resolve(response);
      }
    });
  });
},
getUserAddress: (userId) => {
  return new Promise((resolve, reject) => {
    db.get()
      .collection(collection.ORDER_ADDRESS_COLLECTION)
      .find({ userId: userId })
      .toArray()
      .then((addresses) => {
        resolve(addresses);
      })
      .catch((err) => {
        reject(err);
      });
  });
}
,

getOrderDetails: (userId) => {
  return new Promise(async (resolve, reject) => {
    try {
      const order = await db.get().collection(collection.ORDER_COLLCETION).findOne({ userId });
      if (order) {
        const { mobile, address, pincode } = order.deliveryDetails;
        const user = await db.get().collection(collection.USER_COLLECTION).findOne({ _id: ObjectId(userId) });
        const userName = user ? user.name : '';

        resolve({
          userName,
          address,
          mobile,
          pincode,
          products: order.products,
          totalAmount: order.totalAmount,
          orderStatus: order.status,
          paymentMethod: order.paymentMethod,
          date: order.date
        });
      } else {
        resolve(null);
      }
    } catch (error) {
      console.log(error);
      reject(new Error('Failed to get order details'));
    }
  });
},
getProductNames: (products) => {
  return new Promise(async (resolve, reject) => {
    try {
      const productIds = products.map((product) => product.item);
      
      const productNames = await db.get()
        .collection(collection.PRODUCT_COLLECTION)
        .find({ _id: { $in: productIds } })
        .project({ name: 1 })
        .toArray();
      resolve(productNames.map((product) => product.name));
    } catch (error) {
      console.log(error);
      reject(new Error('Failed to get product names'));
    }
  });
},
 // Helper method to get user by orderId
 getUser: (userId) => {
  return new Promise(async (resolve, reject) => {
    try {
      const user = await db
        .get()
        .collection(collection.USER_COLLECTION)
        .findOne({ _id: ObjectId(userId) });

      if (user) {
        resolve(user);
      } else {
        resolve(null);
      }
    } catch (error) {
      console.log(error);
      reject(new Error('Failed to get user'));
    }
  });
},

// Helper method to get total amount by orderId
getTotalAmountT: (orderId) => {
  return new Promise(async (resolve, reject) => {
    try {
      const order = await db
        .get()
        .collection(collection.ORDER_COLLCETION)
        .findOne({ _id: ObjectId(orderId) });

      if (order && order.products && order.products.length > 0) {
        let total = 0;
        for (const product of order.products) {
          const productDetails = await db
            .get()
            .collection(collection.PRODUCT_COLLECTION)
            .findOne({ _id: ObjectId(product.item) });

          if (productDetails) {
            total += product.quantity * parseFloat(productDetails.Price);
          }
        }
        resolve(total);
      } else {
        resolve(0);
      }
    } catch (error) {
      console.log(error);
      reject(error);
    }
  });
},

// Helper method to update wallet amount
updateWallet: (userId, totalAmount) => {
  return new Promise(async (resolve, reject) => {
    try {
      await db
        .get()
        .collection(collection.WALLET_COLLECTION)
        .findOneAndUpdate(
          { user: ObjectId(userId) },
          { $inc: { amount: totalAmount } },
          { upsert: true }
        );
      resolve();
    } catch (error) {
      console.log(error);
      reject(error);
    }
  });
}
,

getWallet: async (userId) => {
  try {
    const wallet = await db.get().collection(collection.WALLET_COLLECTION).findOne({ user: ObjectId(userId) });
    return wallet;
  } catch (error) {
    throw new Error('Failed to get wallet');
  }
}
,
minusWallet: (userId, totalAmount) => {
  return new Promise(async (resolve, reject) => {
    try {
      await db
        .get()
        .collection(collection.WALLET_COLLECTION)
        .findOneAndUpdate(
          { user: ObjectId(userId) },
          { $inc: { amount: -totalAmount } }, // Subtract totalAmount from the existing amount
          { upsert: true }
        );
      resolve();
    } catch (error) {
      console.log(error);
      reject(error);
    }
  });
},


getUserCoupons: async (userId) => {
  try {
    const user = await db.get().collection(collection.USER_COLLECTION).findOne({ _id: ObjectId(userId) });
    const coupons = [];
    if (user && user.coupons && user.coupons.length > 0) {
      for (const couponId of user.coupons) {
        const coupon = await db.get().collection(collection.COUPON_COLLECTION).findOne({ _id: ObjectId(couponId) });
        if (coupon) {
          coupons.push(coupon);
        }
      }
    }
    return coupons;
  } catch (error) {
    throw error;
  }
},



// Get a coupon based on total price
getOneCoupon: (totalPrice, user) => {
  return new Promise((resolve, reject) => {
    totalPrice = Number(totalPrice); // Convert totalPrice to a number
    db.get().collection(collection.COUPON_COLLECTION).findOne({
      minPurchase: { $lt: totalPrice },
      _id: { $not: { $in: Array.isArray(user.coupons) ? user.coupons : [] } } // Exclude already used coupons
    }, (err, coupon) => {
      if (err) {
        reject(err);
      } else {
        if (coupon) {
          resolve(coupon._id);
        } else {
          resolve(null); // Return null if no applicable coupon found
        }
      }
    });
  });
}


,


// Check if the coupon has already been used by the user ORGINAL
checkUsed: (couponId, userId) => {
  return new Promise((resolve, reject) => {
    db.get().collection(collection.USER_COLLECTION).findOne({
      _id: userId,
      coupons: couponId
    }, (err, user) => {
      if (err) {
        reject(err);
      } else {
        resolve(user !== null);
      }
    });
  });
},






// Add the coupon ID to the user collection
addCouponToUser: (couponId, userId) => {
  return new Promise((resolve, reject) => {
    db.get().collection(collection.USER_COLLECTION).updateOne(
      { _id: userId },
      { $addToSet: { coupons: couponId } },
      (err) => {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      }
    );
  });
},
getUserCoupon: (couponCode) => {
  return new Promise((resolve, reject) => {
    db.get()
      .collection(collection.COUPON_COLLECTION)
      .findOne({ code: couponCode })
      .then((coupon) => {
        resolve(coupon);
      })
      .catch((error) => {
        reject(error);
      });
  });
},
getOrderAddress: (userAddressId) => {
  return new Promise((resolve, reject) => {
    db.get()
      .collection(collection.ORDER_ADDRESS_COLLECTION)
      .findOne({ _id:ObjectId(userAddressId) })
      
      .then((addresses) => {
        resolve(addresses);
      })
      .catch((err) => {
        reject(err);
      });
  });
},
updateOrderAddress: (orderAddressId, updatedAddress) => {
  return new Promise((resolve, reject) => {
    db.get()
      .collection(collection.ORDER_ADDRESS_COLLECTION)
      .updateOne(
        { _id: ObjectId(orderAddressId) },
        { $set: updatedAddress }
      )
      .then(() => {
        resolve();
      })
      .catch((err) => {
        reject(err);
      });
  });
},
 deleteAddress : (addressId) => {
  return new Promise((resolve, reject) => {
    db.get()
      .collection(collection.ORDER_ADDRESS_COLLECTION)
      .deleteOne({ _id: ObjectId(addressId) })
      .then((response) => {
        resolve(response);
      })
      .catch((error) => {
        reject(error);
      })
  })
},


};
