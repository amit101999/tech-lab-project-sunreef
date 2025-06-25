const express = require("express");
const cors = require("cors")
const app = express()
const dotenv = require("dotenv").config({ path: __dirname + "/.env" });
const axios = require("axios")
const multer = require("multer");
const upload = multer();

app.use(cors())
app.use(express.json())

let globalAccessToken = ""
const client_id = process.env.CLIENT_ID
const client_secret = process.env.CLIENT_SECRET
const refresh_token = process.env.REFRESH_TOKEN

// console.log(client_id , client_secret , refresh_token)

async function generateAccessToken() {
  if (globalAccessToken) {
    return globalAccessToken; // Return the global token if it's already set
  }
 
 try {
    const url = `https://accounts.zoho.com/oauth/v2/token?grant_type=refresh_token&client_id=${client_id}&client_secret=${client_secret}&redirect_uri=https://crm.zoho.com/sss&refresh_token=${refresh_token}`;
    const response = await axios.post(url);

    if (response.data && response.data.access_token) {
      globalAccessToken = response.data.access_token; // Save the token globally
      return globalAccessToken;
    } else {
      throw new Error("Access token not found in the response.");
    }
  } catch (error) {
    console.error("Error fetching access token:", error.message);
    throw error;
  }
}

async function createZohoTicket(ticketData) {
  try {
    const accessToken = await generateAccessToken(); 
    console.log("create zoho ticket " , accessToken)
 
    const url = `https://desk.zoho.com/api/v1/tickets`;
    const headers = {
      "Authorization": `Zoho-oauthtoken ${accessToken}`,
      "Content-Type": "application/json",
    };
 
    const email = ticketData["email"] 
    const projectCode = ticketData["projectCode"]
    const departmentID = ticketData["department"] 
    const team = ticketData["team"] 
    const priority = ticketData["priority"] 
    const severity = ticketData["severity"]   
    const projectTitle = ticketData["projectTitle"]   
    const description = ticketData["description"]   
 
    const data = {
      subject : projectTitle ,
      email : email,
      departmentId : departmentID ,
      teamId : team ,
      priority : priority ,
      description:  description ,
      contactId : "1142108000000642254",
      status: "Open" ,
      cf:{
        cf_project_code : projectCode ,
        cf_severity : severity
      } 
      }
      // console.log(data)
 
    const response = await axios.post(url, data, { headers });
    console.log("Ticket created successfully:", response.data);
    // console.log("Ticket created successfully:", response.status);
    return response
  } catch (error) {
    console.error("Error creating ticket:", error);
    // Returning a failed response for the current ticket
    throw new Error("Ticket creation failed");
  }
}

app.get("/", (req, res)=>{
  return res.json({message:"hello"})
})

app.get("/get-users", async (req, res) => {
  try {
     accessToken = await fetchAccessToken();
    console.log("access Token: ", accessToken);
    // Replace with your token
    if (!accessToken) {
      return res.status(500).json({
        message: "access token not found",
      });
    }
    const response = await axios.get(
      "https://desk.zoho.com/api/v1/cm_internal_users",
      {
        params: {
      viewId: "1142108000000380150",
      fields: "cf_email"
      },
        headers: {
          Authorization: `Zoho-oauthtoken ${accessToken}`,
          orgId: ZOHO_ORG_ID,
          "Content-Type": "application/json",
        },
      }
    );
    
    res.json(response.data);
  } catch (error) {
    console.error("Full error object:", error);
    console.error(
      "Error details:",
      error.response ? JSON.stringify(error.response.data, null, 2) : error.message
    );
    res.status(500).json({ error: "Failed to fetch custom module data" });
  }
});

app.post("/create-ticket"  , upload.single("fileUpload") ,  async (req,res)=>{
    //  const accessToken = generateAccessToken();
    const body = req.body;
    const file = req.file;
    console.log("body",body)
    
   try{
        const response = await createZohoTicket(body)
        res.json({message:"ticket created successfully"})
    }catch(err){
    console.log("error in uploading the data to zoho desk",err)
    }
    

})

app.listen(8000 , ()=>{
    console.log("server started 8000")
})