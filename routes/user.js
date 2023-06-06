var express = require("express");
var router = express.Router();
var productHelpers = require("../helpers/product-helpers");
const userHelpers = require("../helpers/user-helpers");
const { response } = require("../app");
const nodemailer = require('nodemailer');

var collection = require("../config/collections");
// Function to generate a random alphanumeric token
function generateToken() {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const tokenLength = 6;
  let token = '';

  for (let i = 0; i < tokenLength; i++) {
    const randomIndex = Math.floor(Math.random() * characters.length);
    token += characters[randomIndex];
  }

  return token;
}



let alert = require("alert");
const path = require('path');
const objectId = require("mongodb").ObjectId;


var db=require("../config/connection");
var collection=require("../config/collections");
const { ObjectId } = require("mongodb");
const adminHelpers = require("../helpers/admin-helpers");

const verifyLogin=function(req,res,next){
  if(req.session.user.loggedIn){
    next()
  }else{
    res.redirect("/login")
  }
}


const goToHomeIfLoggedIn = (req, res, next) => {
  if(req.session.user) {
    res.redirect('/');
  } else {
    next();
  }
}

const goToHomeIfNotLoggedInOrVerified = (req, res, next) => {
  if(!req.session.user || req.session.user?.isVerified) {
    res.redirect('/');
  } else {
    next();
  }
}

const goToLoginIfNotLoggedIn = (req, res, next) => {
  if(!req.session.user) {
    res.redirect('/login');
  } else {
    next();
  }
}



//USER HOME PAGE
router.get("/", async function (req, res, next) {
  let user = req.session.user;
  let banner = await userHelpers.getBanners();
  console.log(user);
  res.render("user/user-home", { banner, user, loggedIn: req.session.user?.loggedIn });
});

// //PRODUCT LIST PAGE ORGINAL
// router.get("/products", async function (req, res, next) {
//   let user = req.session.user;
//   let cartCount = null;

//   const search = req.query.search;
//   const category = req.query.category;
//   let currentPage = parseInt(req.query.page) || 1; // Current page number
//   const limit = 3; // Number of products per page

//   console.log("req.query.page:", req.query.page);
//   console.log("currentPage:", currentPage);
//   if (req.session.user) {
//     cartCount = await userHelpers.getCartCount(req.session.user._id);
//   }

//   const query = {};

//   if (search) {
//     query.Name = { $regex: search, $options: 'i' };
//   }

//   if (category) {
//     query.Category = category;
//   }

//   const categories = await userHelpers.getAllCategories();

//   productHelpers.getPaginatedProducts(query, currentPage, limit).then((result) => {
//     const products = result.products;
//     const totalCount = result.totalCount;
//     const totalPages = Math.ceil(totalCount / limit);

//     // Ensure currentPage is within valid range
//     if (currentPage > totalPages) {
//       currentPage = totalPages;
//     }

//     res.render("user/view-products", {
//       products,
//       categories,
//       cartCount,
//       user,
//       user: true,
//       loggedIn: req.session.user?.loggedIn,
//       currentPage,
//       totalPages,
//     });
//   });
// });


//implimenting out of stock
// router.get("/products", async function (req, res, next) {
//   let user = req.session.user;
//   let cartCount = null;

//   const search = req.query.search;
//   const category = req.query.category;
//   let currentPage = parseInt(req.query.page) || 1; // Current page number
//   const limit = 3; // Number of products per page

//   console.log("req.query.page:", req.query.page);
//   console.log("currentPage:", currentPage);
//   if (req.session.user) {
//     cartCount = await userHelpers.getCartCount(req.session.user._id);
//   }

//   const query = {};

//   if (search) {
//     query.Name = { $regex: search, $options: 'i' };
//   }

//   if (category) {
//     query.Category = category;
//   }

//   const categories = await userHelpers.getAllCategories();

//   productHelpers.getPaginatedProducts(query, currentPage, limit).then((result) => {
//     const products = result.products.map((product) => {
//       return {
//         ...product,
//         STOCK: product.Quantity > 0,
//       };
//     });

//     const totalCount = result.totalCount;
//     const totalPages = Math.ceil(totalCount / limit);

//     // Ensure currentPage is within valid range
//     if (currentPage > totalPages) {
//       currentPage = totalPages;
//     }

//     res.render("user/view-products", {
//       products,
//       categories,
//       cartCount,
//       user,
//       user: true,
//       loggedIn: req.session.user?.loggedIn,
//       currentPage,
//       totalPages,
//     });
//   });
// });

//implimenting globel search
router.get("/search", async function (req, res, next) {
  const searchQuery = req.query.search;

  // Redirect to the product list page with the search query as a parameter
  res.redirect(`/products?search=${searchQuery}`);
});

router.get("/products", async function (req, res, next) {
  let user = req.session.user;
  let cartCount = null;

  const search = req.query.search;
  const category = req.query.category;
  let currentPage = parseInt(req.query.page) || 1; // Current page number
  const limit = 3; // Number of products per page

  console.log("req.query.page:", req.query.page);
  console.log("currentPage:", currentPage);
  if (req.session.user) {
    cartCount = await userHelpers.getCartCount(req.session.user._id);
  }

  const query = {};

  if (search) {
    query.Name = { $regex: search, $options: 'i' };
  }

  if (category) {
    query.Category = category;
  }

  const categories = await userHelpers.getAllCategories();

  const result = await productHelpers.getPaginatedProducts(query, currentPage, limit);
  const products = result.products.map((product) => {
    return {
      ...product,
      STOCK: product.Quantity > 0,
    };
  });

  const totalCount = result.totalCount;
  const totalPages = Math.ceil(totalCount / limit);

  // Ensure currentPage is within valid range
  if (currentPage > totalPages) {
    currentPage = totalPages;
  }

  res.render("user/view-products", {
    products,
    categories,
    cartCount,
    user,
    user: true,
    loggedIn: req.session.user?.loggedIn,
    currentPage,
    totalPages,
  });
});


// USER LOGIN 
router.get("/login", goToHomeIfLoggedIn, (req, res) => {
  if (req.session.user) {
    // let user=req.session.user
    res.redirect("/");
  } else {
   
    res.render("user/login", { loginErr: req.session.userLoginErr });
    // res.render(path.join(__dirname, '..', 'views', 'user', 'login'));
    req.session.userLoginErr = false;
  }
});


//USER SIGN UP GET ROUTER
router.get("/signup", goToHomeIfLoggedIn, (req, res) => {
  res.render("user/signup");
});

//USER SIGN UP POST ROUTER WITH PROPER VALIDATION 
router.post("/signup", goToHomeIfLoggedIn, async (req, res) => {
  const password = req.body.password;
  if (password.length < 8) {
    // Password length is less than 8 characters
    return res.render("user/signup", { error: "Password must be at least 8 characters long" });
  }

  try {
    const response = await userHelpers.doSignup(req.body);
    console.log(response);
    return res.redirect("/login");
  } catch (error) {
    return res.render("user/signup", { error: error.message });
  }
});



//USER LOGIN POST ROUTER:
router.post("/login", goToHomeIfLoggedIn, (req, res) => {
  userHelpers.doLogin(req.body).then((response) => {
    if (response.status) {
      req.session.user = response.user;
      req.session.user.loggedIn = true;
      
      if (response.user?.isVerified) {
        res.redirect('/');
      } else {
        res.redirect('/verify-email/' + encodeURIComponent(req.body.email));
      }
    } else {
      req.session.userLoginErr = "Invalid Username or Password";
      res.redirect("/login");
    }
  });
});

//USER LOGOUT ROUTER
router.get("/logout", goToLoginIfNotLoggedIn, (req, res) => {
  req.session.destroy(err => {
    if(err) console.log(err);
    res.redirect('/');
  });
});

//OTP VERIFYING GET ROUTER:
router.get('/verify-email/:email', goToHomeIfNotLoggedInOrVerified, (req, res) => {
  const email = req.params.email; // Get the email from the URL parameter
  // Render the verify-email page with the email value
  res.render('user/verify-email', { email });
});

//OTP VERIYING POST ROUTER
router.post('/verify-email', goToHomeIfNotLoggedInOrVerified, async (req, res) => {
  // res.send('verification')
  const user = await db.get().collection(collection.USER_COLLECTION).findOne({email:req.body.email})
  console.log(user);
  if(!user) {
    res.send('No such user');
    return;
  }
  if(req.body.token !== user.verificationToken) {
    res.send('Invalid Token');
    // res.render('user/verify-invalid')
    return;
  }
  await db.get().collection(collection.USER_COLLECTION).updateOne({email:req.body.email}, {$set: {isVerified:true}});
  // res.send('Email successfully verified');
  res.redirect('/')

})

//OTP RESEND POST ROUTER
router.post('/resendOtp/:email', async (req, res) => {
  try {
    const email = req.params.email; // Get the email from the URL parameter
    const response = await userHelpers.resendOtp(email);
    console.log(response);
    return res.redirect("/verify-email/" + encodeURIComponent(email)); // Include email as a URL parameter
    // return res.redirect("/verify-email");
  } catch (error) {
    return res.render("user/signup", { error: error.message });
  }
});

//-------------------------------------------------------------------------

//SINGLE PRODUCT VIEW
router.get("/detail-view/:id",async function(req,res,next){
  console.log("Productpage..........");
  let product=await userHelpers.getProduct(req.params.id)
  res.render("user/detail-view",{user:req.session.user,product})
})

//USER CART
router.get("/cart",async function(req, res) {
 
  if (req.session.user && req.session.user._id) {
   
    let products = await userHelpers.getCartProducts(req.session.user._id);
    let totalValue = await userHelpers.getTotalAmount(req.session.user._id);
    console.log(products);
    res.render("user/cart", {products,user:req.session.user._id,totalValue }); // Pass the user object directly as 'user' property
  } else {
    res.redirect("/login"); // Redirect to login page when user is not available
  }
});

//ADD TO CART
router.get('/add-to-cart/:id',function(req,res){
  console.log("Api call");
    userHelpers.addToCart(req.params.id,req.session.user._id).then(()=>{
     res.json({
       status:true
     })
    })
})

//CHANGING PRODUCT QUANTITY ROUTER
router.post('/change-product-quantity', function (req, res, next) {
  userHelpers.changeProductQuantity(req.body).then(async (response) => {
    response.total = await userHelpers.getTotalAmount(req.body.user);
    res.json(response);
  });
});

//REMOVE FROM CART
router.post('/remove-from-cart', function(req, res, next) {
  userHelpers.removeFromCart(req.body).then((response) => {
    res.json(response);
  });
});

// PLACING ORDER ROUTER
router.get('/place-order', async (req, res) => {
  if (req.session.user) {
    let products = await userHelpers.getCartProducts(req.session.user._id);
    let total = await userHelpers.getTotalAmount(req.session.user._id);
    let addresses = await userHelpers.getUserAddress(req.session.user._id);
    let wallet = await userHelpers.getWallet(req.session.user._id);

    console.log("Total Amount to be Paid: " + total);
    
    let useWallet = wallet.amount >= total;
    res.render('user/place-order', { products, total, user: req.session.user, addresses, wallet, useWallet });
  } else {
    res.redirect('/login');
  }
});

//orginal

//PLACE ORDER POST ROUTER
router.post('/place-order', async (req, res) => {
  let wallet = await userHelpers.getWallet(req.session.user._id);
  let products = await userHelpers.getCartProductsList(req.body.userId);
  let totalPrice = await userHelpers.getTotalAmount(req.body.userId);

  let user = await userHelpers.getUser(req.session.user._id);

  // Sending coupon based on user's purchasing amount
  let couponId = await userHelpers.getOneCoupon(totalPrice, user);

  if (couponId && !await userHelpers.checkUsed(couponId, user._id)) {
    // User hasn't used the coupon, so insert the coupon ID to the user collection
    await userHelpers.addCouponToUser(couponId, user._id);
  }

  let userEnterCoupon = req.body.userEnterCoupon; // Get coupon code user entered in the place order page
  console.log(userEnterCoupon);

  if (userEnterCoupon) {
    // User entered a coupon code, check if it's valid
    let coupon = await userHelpers.getUserCoupon(userEnterCoupon);

    if (coupon) {
      // Calculate the new total price after deducting the coupon offer
      totalPrice -= coupon.offer;
    }
  }

  userHelpers.placeOrder(req.body, products, totalPrice).then((orderId) => {
    if (req.body['payment-method'] === 'COD') {
      req.session.orderDetails = {
        address: req.body.address,
        mobile: req.body.mobile,
        pincode: req.body.pincode,
        totalAmount: totalPrice,
        orderStatus: 'Placed',
        paymentMethod: req.body['payment-method'],
        date: new Date().toISOString()
      };
      res.json({ codSuccess: true });
    } else if (req.body['payment-method'] === 'ONLINE') {
      userHelpers.generateRazorpay(orderId, totalPrice).then((response) => {
        req.session.orderDetails = {
          address: req.body.address,
          mobile: req.body.mobile,
          pincode: req.body.pincode,
          totalAmount: totalPrice,
          orderStatus: 'Placed',
          paymentMethod: req.body['payment-method'],
          date: new Date().toISOString()
        };
        res.json(response);
      });
    } else {
      let walletAmount = wallet.amount;
      let newBalanceWallet = walletAmount - totalPrice;

      userHelpers.minusWallet(req.session.user._id, newBalanceWallet).then((response) => {
        req.session.orderDetails = {
          address: req.body.address,
          mobile: req.body.mobile,
          pincode: req.body.pincode,
          totalAmount: totalPrice,
          orderStatus: 'Placed',
          paymentMethod: 'ONLINE', // Set the payment method as "ONLINE" instead of "WALLET"
          date: new Date().toISOString()
        };
        res.json({ codSuccess: true }); // Return the response as "codSuccess" for consistency with other payment methods
      });
    }
  });
});



//ORDER SUCCES GET ROUTER
router.get('/order-success', (req, res) => {
  res.render('user/order-success', { orderDetails: req.session.orderDetails });
});

//DOWNLOAD INVOICE
router.get('/download-invoice', (req, res) => {
  const {  address, mobile, pincode,  totalAmount, orderStatus, paymentMethod } = req.session.orderDetails;

  // Generate the invoice content
  const invoiceContent = `
   
    Address: ${address}
    Mobile: ${mobile}
    Pincode: ${pincode}
   
    Total Amount: ${totalAmount}
    Order Status: ${orderStatus}
    Payment Method: ${paymentMethod}
  `;

  // Set the response headers to trigger a file download
  res.set({
    'Content-Disposition': 'attachment; filename="invoice.txt"',
    'Content-Type': 'text/plain'
  });

  // Send the invoice content as the response
  res.send(invoiceContent);
});


// GET USER ORDERS 
router.get('/orders',goToLoginIfNotLoggedIn,  async (req, res) => {
  let orders = await userHelpers.getUserOrders(req.session.user._id);

  // Update the rendering logic based on the order status
  orders = orders.map(order => {
    if (order.status === 'delivered') {
      order.canReturn = true;
      order.showCancelButton = true;
    } else if (order.status === 'return') {
      order.canReturn = false;
      order.showCancelButton = false;
    } else {
      order.canReturn = false;
      order.showCancelButton = true;
    }
    return order;
  });

  res.render('user/orders', { user: req.session.user, orders });
});

//VIEW ORDER PRODUCTS
router.get('/view-order-products/:id',async(req,res)=>{
  console.log("view order products");
  let products = await userHelpers.getOrderProducts(req.params.id)
  res.render('user/view-order-products',{user:req.session.user,products})
})

// FORGOT PASSWORD
router.get('/updatePass', (req, res) => {
  res.render('user/update-password');
});

//UPDATE PASSWORD
router.post('/updatePass', async (req, res) => {
  try {
    const { email, newPass } = req.body;
    const user = await userHelpers.getUserByEmail(email);

    if (!user) {
      throw new Error("User not found");
    }

    await userHelpers.doUpdatePassword(user._id.toString(), newPass);

    res.redirect('/login');
  } catch (error) {
    // Handle the error and show an error message
    console.log(error);
    res.render('user/update-password', { loginErr: error.message });
  }
});

//REMOVE ORDER FROM USER SIDE
router.get('/removeOrder/:orderId', async (req, res) => {
  const userId = req.session.user._id;
  const orderId = req.params.orderId;
  try {
    const orders = await userHelpers.getUserOrders(userId);
    res.render('user/removeOrder', { user: req.session.user, orders, orderId });
  } catch (error) {
    console.error('Error fetching user orders:', error);
    res.send("An error occurred while fetching user orders. Please try again.");
  }
});

//REMOVE ORDER POST ROUTER
router.post('/removeOrder/:orderId', (req, res) => {
  const orderId = req.params.orderId;
  const userId = req.body.userId;
  const reason = req.body.reason;

  userHelpers.removeOrder(orderId)
    .then(() => {
      res.redirect('/orders');
    })
    .catch((error) => {
      console.error('Error removing order:', error);
      res.send("An error occurred while removing the order. Please try again.");
    });
});

//RENDERING USER PROFILE
router.get('/profile', async(req, res) => {

  const isVerified = req.session.user.isVerified; // Replace with your verification logic
  res.render('user/profile', { user: req.session.user, isVerified: isVerified });
});

//VERIFYING USER PAYMENT
router.post('/verify-payment', (req, res) => {
  userHelpers.verifyPayment(req.body).then(() => {

    userHelpers.changePaymentStatus(req.body['order[receipt]']).then(() => {
      console.log("payment successful")
      res.json({ status: true })
    })
  }).catch((err) => {
    console.log(err)
    res.json({ status: false, errMsg: '' })
  })

})

//RETURN ORDER ROUTER
router.get('/returnOrder/:orderId', async (req, res) => {
  const userId = req.session.user._id;
  const orderId = req.params.orderId;
  try {
    const orders = await userHelpers.getUserOrders(userId);
    res.render('user/returnOrder', { user: req.session.user, orders, orderId });
  } catch (error) {
    console.error('Error fetching user orders:', error);
    res.send("An error occurred while fetching user orders. Please try again.");
  }
});

//RETURN POST ROUTER
router.post('/returnOrder/:id/return', async (req, res) => {
  try {
    const orderId = req.params.id;
    const reason = req.body.reason;

    const order = await db
      .get()
      .collection(collection.ORDER_COLLCETION)
      .findOne({ _id: ObjectId(orderId) });

    if (order.paymentMethod === 'ONLINE') {
      const user = await userHelpers.getUser(order.userId);
      const totalAmount = await userHelpers.getTotalAmountT(orderId);
      await userHelpers.updateWallet(user._id, totalAmount);
    }

   
    await userHelpers.updateStatus(orderId, 'return');
    // Add code to handle the return reason, such as saving it to the database

    res.redirect('/orders');
  } catch (error) {
    console.error('Error updating order status:', error);
    res.send('An error occurred while updating the order status. Please try again.');
  }
});

//ADD ADDRESS ROUTER
router.post('/addAddress/:id', async (req, res) => {
  try {
    const userId = req.params.id;
    const addressData = {
      userId: userId,
      address: req.body.address,
      pincode: req.body.pincode,
      mobile: req.body.mobile
    };

    await userHelpers.addUserAddress(addressData);
    res.sendStatus(200);
  } catch (error) {
    console.error('Error adding address:', error);
    res.sendStatus(500);
  }
});

//WALLET GET ROUTER
router.get('/wallet',goToLoginIfNotLoggedIn,  async (req, res) => {
  const userId = req.session.user._id;
  const wallet = await userHelpers.getWallet(userId);
  res.render('user/wallet', { wallet }); // Pass the wallet data to the template
});

//COUPON GET ROUTER
router.get('/coupon',goToLoginIfNotLoggedIn, async (req, res) => {
  const userId = req.session.user._id;
  const coupons = await userHelpers.getUserCoupons(userId);
  res.render('user/coupon', { coupons });
});

//EDIT ADDRESS ROUTER
router.get('/edit-address/:orderAddressId', async (req, res) => {
  const orderAddressId = req.params.orderAddressId;
  
let address= await userHelpers.getOrderAddress(orderAddressId)
   console.log(address);
  res.render('user/editAddress', { orderAddressId, address: address });
});

//UPDATE ADDRESS ROUTER
router.post('/update-address/:orderAddressId', async (req, res) => {
  const orderAddressId = req.params.orderAddressId;
  const updatedAddress = {
    address: req.body.address,
    pincode: req.body.pincode,
    mobile: req.body.mobile
  };
  
  await userHelpers.updateOrderAddress(orderAddressId, updatedAddress);
  
  res.redirect('/place-order');
});

//DELETE ADDRESS ROUTER
router.get('/delete-address/:id', async (req, res) => {
  const addressId = req.params.id;
  await userHelpers.deleteAddress(addressId);
  res.redirect('/place-order');
});


module.exports = router;
