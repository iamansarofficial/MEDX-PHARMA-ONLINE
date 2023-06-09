var express = require('express');
const {render, route}=require("../app")
var router = express.Router();
var productHelper=require("../helpers/product-helpers")
const fileUpload = require('express-fileupload');
const productHelpers = require('../helpers/product-helpers');
const adminHelpers=require('../helpers/admin-helpers')
const userHelpers=require('../helpers/user-helpers')
const catHelpers=require('../helpers/category-helpers')
const fs = require('fs');
const path = require('path');
const PDFDocument = require('pdfkit');
const ExcelJS = require('exceljs');


const verifyALogin = function(req, res, next) {
  if (req.session.admin && req.session.admin.loggedIn) {
    next();
  } else {
    res.redirect("/admin/adminLogin");
  }
};

//GET ADMIN PAGE
router.get('/', verifyALogin, async function(req, res, next) {
  try {
    const admin = req.session.admin;
    const products = await productHelpers.getAllProducts();
    const categories = await adminHelpers.getAllCategories();
    const orders = await adminHelpers.getOrdersByToday(); // Fetch today's orders
    const cashAmount = await adminHelpers.getCashOrderAmount(); // Fetch cash payment amount
    const onlineAmount = await adminHelpers.getOnlineOrderAmount(); // Fetch online payment amount
    const yesterdayRevenue = await adminHelpers.getYesterdayRevenue(); // Fetch yesterday's revenue
    const todayRevenue = await adminHelpers.getTodayRevenue(); // Fetch today's revenue

    // Calculate total revenue
    let totalRevenue = 0;
    orders.forEach(order => {
      totalRevenue += order.totalAmount;
    });

    res.render('admin/admin-home', { admin: true, products, admin, categories, orders, totalRevenue, cashAmount, onlineAmount, yesterdayRevenue, todayRevenue });
  } catch (error) {
    // Handle errors
    next(error);
  }
});

// GET SALES REPORT ORGINAL
router.get('/salesreport', verifyALogin, async (req, res, next) => {
  try {
    const selectedRange = req.query.range;
    const cashAmount = await adminHelpers.getCashOrderAmount(); // Fetch cash payment amount
    const onlineAmount = await adminHelpers.getOnlineOrderAmount(); // Fetch online payment amount
    let orders = []; // Define an empty array to store the fetched orders

    // Check the selected range and fetch orders accordingly
    if (selectedRange === 'today') {
      orders = await adminHelpers.getOrdersByToday(); // Fetch orders for today
    } else if (selectedRange === 'week') {
      orders = await adminHelpers.getOrdersByWeek(); // Fetch orders for the current week
    } else if (selectedRange === 'month') {
      orders = await adminHelpers.getOrdersByMonth(); // Fetch orders for the current month
    } else if (selectedRange === 'year') {
      orders = await adminHelpers.getOrdersByYear(); // Fetch orders for the current year
    }

// Calculate total revenue
let totalRevenue = 0;
orders.forEach(order => {
  totalRevenue += order.totalAmount;
});


    res.render('admin/admin-home', { admin: true, orders, totalRevenue,cashAmount, onlineAmount });
  } catch (error) {
    // Handle errors
    next(error);
  }
});


//VIEW PRODUCTS IN ADMIN SIDE
router.get('/view-products', verifyALogin,function(req, res, next) {
  let admin=req.session.admin
  productHelpers.getAllProducts().then((products)=>{
    res.render('admin/view-products',{admin:true,products,admin})
  })
  
});



//ADD PRODUCTS IN ADMIN SIDE
router.get('/add-product', verifyALogin, async (req, res) => {
  try {
    const categories = await adminHelpers.getAllCategories();
    res.render('admin/add-product', { categories });
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.send("An error occurred while fetching categories. Please try again.");
  }
});

//NEW ADD PRODUCT ROUTER
router.post('/add-product', async (req, res) => {
  try {
    const categoryName = req.body.Category;
    const category = await adminHelpers.getCategoryByName(categoryName);
    const listed = category ? category.Listed || false : false; // Set listed to false if the category is not found

    const productData = {
      Name: req.body.Name,
      Category: categoryName, // Store the category name
      Listed: listed,
      Price: req.body.Price,
      Quantity: parseInt(req.body.Quantity),
      Description: req.body.Description,
    };
   console.log(productData);

    let imageFile;

    productHelpers.addProduct(productData, (id) => {
      if (req.body.CroppedImage) {
        // Save the cropped image
        const croppedImageData = req.body.CroppedImage.replace(/^data:image\/jpeg;base64,/, '');
        const imagePath = './public/product-images/' + id + '.jpeg';
        fs.writeFileSync(imagePath, croppedImageData, 'base64');
        imageFile = imagePath;
      } else if (req.files && req.files.Image) {
        // Save the original image
        const image = req.files.Image;
        const imagePath = './public/product-images/' + id + '.jpeg';
        image.mv(imagePath);
        imageFile = imagePath;
      }

      if (imageFile) {
        productData.Image = imageFile;
      }

      res.render('admin/add-product');
    });
  } catch (error) {
    console.error('Error adding product:', error);
    res.send("An error occurred while adding the product. Please try again.");
  }
});


//ADMIN LOGIN
router.get('/adminLogin',function(req,res){
  if(req.session.admin){
    res.redirect("/")
  }
  else{
    res.render('admin/login',{"loginErr":req.session.adminLoginErr})
    req.session.adminLoginErr=false
  }
 
})

//ADMIN POST LOGIN ROUTER
router.post('/adminLogin',(req,res)=>{
  adminHelpers.doLogin(req.body).then((response)=>{
    if(response.status){
      
      console.log("Admin in successfully loged in>>>>>>>>>>><<<<<<<<<<");
      req.session.admin=response.admin
      req.session.admin.loggedIn=true
      res.redirect('/admin')
    }
    else{
      req.session.adminLoginErr=true
      res.redirect('/admin/adminLogin') 
    }
  })
})

//ADMIN LOGOUT
router.get("/adminLogout",function(req,res){
  req.session.admin=null
  res.redirect("/admin/adminLogin")
})

//EDIT PRODUCT
router.get("/edit-product/:id",verifyALogin,async function(req,res,next){
  let product=await productHelpers.getProductDetails(req.params.id)
  console.log(product);
  res.render('admin/edit-product',{admin:true,product})
})

//EDIT PRODUCT POST ROUTER
router.post("/edit-product/:id",function(req,res){
  let id=req.params.id
  productHelpers.updateProduct(req.params.id,req.body).then(()=>{
    res.redirect("/admin/view-products")
    if(req.files.Image){
      let image=req.files.Image
      image.mv('./public/product-images/'+id+'.jpeg')
     
    }
  })
})

//DELETE PRODUCT
router.get('/delete-product/:id',(req,res)=>{
  let proId=req.params.id
  productHelpers.deleteProduct(proId).then((response)=>{
    res.redirect('/admin/view-products')
  })
})

//ALL USERS
router.get("/allUsers",verifyALogin,async (req,res)=>{
  let users=await adminHelpers.getAllUsers(req.session)
  res.render("admin/all-users",{admin:true,users})
})

//CATEGORY MANAGEMENT
router.get('/category', verifyALogin, function(req, res, next) {
  let admin = req.session.admin;
  productHelpers.getAllCategory().then((categories) => {
    res.render('admin/admin-category', { admin: true, categories, admin });
  });
});


//EDIT CATEGORY
router.get("/edit-category/:id",verifyALogin,async function(req,res,next){
  let category=await productHelpers.getCategoryDetails(req.params.id)
  console.log(category);
  res.render('admin/edit-category',{admin:true,category})
})

//EDIT CATEGORY ROUTER
router.post("/edit-category/:id",function(req,res){
  let id=req.params.id
  productHelpers.updateCategory(req.params.id,req.body).then(()=>{
    res.redirect("/admin/category")
  })
})

//DELETE PRODUCT
router.get('/delete-category/:id',(req,res)=>{
  let catId=req.params.id
  productHelpers.deleteCategory(catId).then((response)=>{
    res.redirect('/admin/category')
  })
})


//ADD CATEGORY
router.get('/add-category',verifyALogin,(req,res)=>{
  res.render('admin/add-category')
})


//ADD CATEGORY POST ROUTER:
router.post('/add-category', (req, res) => {
  productHelpers.addCategory(req.body, (err, categoryId) => {
    if (err) {
      res.render('admin/add-category', { error: err });
    } else {
      res.render('admin/add-category');
    }
  });
});


//ADMIN ALL-ORDERS
router.get('/allOrders',verifyALogin, async (req,res)=>{
   let orders = await adminHelpers.getUserOrders(req.session)
   res.render("admin/all-orders",{admin:req.session.admin,orders})
})

//update return accepted
router.get('/viewUserOrderProducts/:id', async (req, res) => {
  try {
    const products = await adminHelpers.getUserOrderProducts(req.params.id);
    const thisUser = await adminHelpers.getThisUser(req.params.id);
    const orderReturn= await adminHelpers.getReturnStatus(req.params.id)
    res.render('admin/view-user-orders', { admin: req.session.admin,orderReturn, products, user: thisUser, orderId: req.params.id });
  } catch (error) {
    console.error('Error fetching user order products:', error);
    res.send("An error occurred while fetching user order products. Please try again.");
  }
});

//VIEW USER ORDERS POST ROUTER
router.post('/viewUserOrderProducts/:id', async (req, res) => {
  try {
    const orderId = req.params.id;
    await adminHelpers.removeOrder(orderId);
    res.redirect('/admin/allOrders');
  } catch (error) {
    console.error('Error removing order:', error);
    res.send("An error occurred while removing the order. Please try again.");
  }
});


//BLOCK USER IN ADMIN SIDE
router.get('/block/:userId', verifyALogin, async (req, res) => {
  let userId = req.params.userId;
  await adminHelpers.blockUser(userId);
  res.redirect('/admin/allUsers');
});

//UNBLOCK USER IN ADMIN SIDE
router.get('/unblock/:userId', verifyALogin, async (req, res) => {
  let userId = req.params.userId;
  await adminHelpers.unblockUser(userId);
  res.redirect('/admin/allUsers');
});


//UNLIST CATEGORY
router.get('/unlist-category/:id', verifyALogin, (req, res) => {
  let categoryId = req.params.id;
  productHelpers.unlistCategory(categoryId).then(() => {
    catHelpers.unlistProductsByCategory(categoryId).then(() => {
      res.redirect('/admin/category');
    });
  });
});

//LIST CATEGORY
router.get('/list-category/:id', verifyALogin, (req, res) => {
  let categoryId = req.params.id;
  productHelpers.listCategory(categoryId).then(() => {
    catHelpers.listProductsByCategory(categoryId).then(() => {
      res.redirect('/admin/category');
    });
  });
});

// GET SALES REPORT AND DOWNLOAD ROUTER
router.get('/salesreport/download/pdf/:range', verifyALogin, async (req, res, next) => {
  try {
    const range = req.params.range;
    let orders;

    if (range === 'today') {
      orders = await adminHelpers.getOrdersByToday();
    } else if (range === 'week') {
      orders = await adminHelpers.getOrdersByWeek();
    } else if (range === 'month') {
      orders = await adminHelpers.getOrdersByMonth();
    } else if (range === 'year') {
      orders = await adminHelpers.getOrdersByYear();
    } else {
      return res.status(400).json({ error: 'Invalid range specified' });
    }

    // Create a new PDF document
    const doc = new PDFDocument();

    // Set the response headers
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename="sales_report.pdf"');

    // Pipe the PDF document to the response
    doc.pipe(res);

    // Write the content to the PDF document
    doc.text(`Sales Report - ${range}`, { align: 'center', fontSize: 20, marginBottom: 10 });

    let totalRevenue = 0; // Initialize total revenue

    // Iterate through orders and add them to the PDF document
    orders.forEach((order) => {
      doc.text(`Date: ${order.date}`, { fontSize: 12 });
      doc.text(`Orders: ${order.products[0].quantity}`, { fontSize: 12 });
      doc.text(`Delivery Details: ${order.deliveryDetails.address}`, { fontSize: 12 });
      doc.text(`Status: ${order.status}`, { fontSize: 12 });
      doc.text(`Payment Method: ${order.paymentMethod}`, { fontSize: 12 });
      doc.text(`Revenue: $${order.totalAmount}`, { fontSize: 12 });
      doc.moveDown(0.5);

      totalRevenue += order.totalAmount; // Add order amount to total revenue
    });

    // Add total revenue to the PDF document
    doc.text(`Total Revenue: $${totalRevenue}`, { fontSize: 12 });

    // End the PDF document
    doc.end();
  } catch (error) {
    // Handle errors
    next(error);
  }
});

// GET SALES REPOST DOWNLOAD PDF ROUTER
router.get('/salesreport/download/excel/:range', verifyALogin, async (req, res, next) => {
  try {
    const range = req.params.range;
    let orders;

    if (range === 'today') {
      orders = await adminHelpers.getOrdersByToday();
    } else if (range === 'week') {
      orders = await adminHelpers.getOrdersByWeek();
    } else if (range === 'month') {
      orders = await adminHelpers.getOrdersByMonth();
    } else if (range === 'year') {
      orders = await adminHelpers.getOrdersByYear();
    } else {
      return res.status(400).json({ error: 'Invalid range specified' });
    }

    // Create a new Excel workbook
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Sales Report');

    // Set column widths
    worksheet.getColumn('A').width = 15; // Date column width

    // Add headers to the worksheet
    worksheet.addRow(['Date', 'Orders', 'Delivery Details', 'Status', 'Payment Method', 'Revenue']);

    let totalRevenue = 0; // Initialize total revenue

    // Iterate through orders and add them to the worksheet
    orders.forEach((order) => {
      worksheet.addRow([
        order.date.toISOString(),
        order.products[0].quantity,
        order.deliveryDetails.address,
        order.status,
        order.paymentMethod,
        order.totalAmount
      ]);

      totalRevenue += order.totalAmount; // Add order amount to total revenue
    });

    // Add total revenue row to the worksheet
    worksheet.addRow(['Total Revenue', '', '', '', '', totalRevenue]);

    // Set the response headers
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename="sales_report.xlsx"');

    // Generate the Excel file and send it in the response
    const buffer = await workbook.xlsx.writeBuffer();
    res.send(buffer);
  } catch (error) {
    // Handle errors
    next(error);
  }
});

//BANNER MANAGEMENT
router.get('/banner',async(req,res)=>{
let banner=await adminHelpers.getBanners()
  res.render('admin/banner',{admin:req.session.admin,banner})
})

//ADD BANNER
router.get('/addBanner',(req,res)=>{
  res.render('admin/add-banner',{admin:req.session.admin})
})

//BANNER POST ROUTER
router.post('/addBanner',(req,res)=>{
   
  adminHelpers.addBanner(req.body,(id)=>{
    let image=req.files.Image
    image.mv('./public/product-images/'+id+'.jpeg',(err,done)=>{
      if(!err){
        res.render('admin/add-banner')
      }else{
        console.log(err);
      }
    })
    
  })
})

//impliment when admin click return accepted we must back the user purchase quantity to db
router.get('/changeOrderStatus/:id/:status', async (req, res) => {
  try {
    const orderId = req.params.id;
    const status = req.params.status;

    if (status === 'Return-Accepted') {
      // Retrieve the user ID associated with the order
      const userId = await adminHelpers.getUserIdFromOrder(orderId);

      // Retrieve the order details
      const order = await adminHelpers.getOrderDetails(orderId);

     // Retrieve the product IDs and purchased quantities from the order
const productIds = order.products.map(product => product.item?.toString()); // Use optional chaining and convert to string
const purchasedQuantities = order.products.map(product => product.quantity);
console.log(productIds);
console.log(purchasedQuantities);

      // Update the product quantities by adding the purchased quantities back
      await adminHelpers.returnProductsQuantityBackToDb(productIds, purchasedQuantities);
      
      // Update the user's wallet
      const totalAmount = order.totalAmount;
      await adminHelpers.updateWallet(userId, totalAmount);
    }

    // Update the order status
    await adminHelpers.updateStatus(orderId, status);

    res.redirect(`/admin/viewUserOrderProducts/${orderId}`);
  } catch (error) {
    console.error('Error updating order status:', error);
    res.send("An error occurred while updating the order status. Please try again.");
  }
});

//GET COUPONS
router.get('/coupon', async (req, res) => {
  const coupons = await adminHelpers.getAllCoupons();
  res.render('admin/coupon', { coupons });
});

//ADD COUPONS GET ROUTER
router.get('/add-coupon',(req,res)=>{
  res.render('admin/add-coupon')
})


//IMPLIMENT UNIQUE FOR COUPON CODE
// ADD COUPONS POST ROUTER
router.post('/add-coupon', async (req, res) => {
  const couponDetails = req.body;
  try {
    const isCodeUnique = await adminHelpers.isCouponCodeUnique(couponDetails.code);
    if (isCodeUnique) {
      await adminHelpers.addCoupon(couponDetails);
      res.redirect('/admin/coupon'); // Redirect to the coupon listing page after successful addition
    } else {
      res.render('admin/add-coupon', { error: 'Coupon code is already used' });
    }
  } catch (error) {
    console.log(error);
    res.render('admin/add-coupon', { error: 'Failed to add coupon' });
  }
});
 


//DELETE BANNER
router.get('/delete-banner/:id',(req,res)=>{
  let bannerId=req.params.id
  productHelpers.deleteBanner(bannerId).then((response)=>{
    res.redirect('/admin/banner')
  })
})



module.exports = router;
