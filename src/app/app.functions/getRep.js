const axios = require('axios');
const GoogleSpreadsheet = require('google-spreadsheet');

const {
    JWT
} = require('google-auth-library');

const creds = require('./googleAuthCreds.json'); // the file saved above





exports.main = async (context = {}, sendResponse) => {

    try {

        const { hs_object_id } = context.propertiesToSend;

        const axiosConfig = {
            headers: {
                authorization: `Bearer ${process.env.PRIVATE_APP_ACCESS_TOKEN}`
            }
        };


        /**
         * Handles errors thrown by axios requests and logs relevant information.
         *
         * @param {Error} error - The error object thrown by axios.
         */
        /**
         * Handles errors thrown by axios requests and logs relevant information.
         *
         * @param {Error} error - The error object thrown by axios.
         */
        const axiosErrorHandler = error => {
            if (error.response) {
                // The request was made and the server responded with a status code
                // that falls out of the range of 2xx
                console.log(error.response.data);
                console.log(error.response.status);
                console.log(error.response.headers);
            } else if (error.request) {
                // The request was made but no response was received
                // `error.request` is an instance of XMLHttpRequest in the browser 
                // and an instance of http.ClientRequest in node.js
                console.log(error.request);
            } else {
                // Something happened in setting up the request that triggered an Error
                console.log('Error', error.message);
            }
        }

        const getUserData = async (email) => {
            const endPoint = `https://api.hubapi.com/crm/v3/owners/?email=${email}&limit=100&archived=false`;
            const data = await axios.get(endPoint, axiosConfig);
            return data;
        }

        const updateContact = async (contactId, propertiesToUpdate) => {
            const endPoint = `https://api.hubapi.com/crm/v3/objects/contacts/${contactId}`;
            const data = await axios.patch(endPoint, {
                "properties": propertiesToUpdate
            }, axiosConfig);
            return data;
        }

        const { postalCode } = context.parameters;

        console.log(context.parameters)

        const SCOPES = [
            'https://www.googleapis.com/auth/spreadsheets',
            'https://www.googleapis.com/auth/drive.file',
        ];

        const jwt = new JWT({
            email: creds.client_email,
            key: creds.private_key,
            scopes: SCOPES,
        });

        const sheetId = "1-uT06VXrvOCIm31V7aB8v4O4O8ohBCmMckUjX8DyTYQ";
        const doc = new GoogleSpreadsheet.GoogleSpreadsheet(sheetId, jwt);

        await doc.loadInfo(); // loads document properties and worksheets

        const sheet = doc.sheetsByTitle.postalCodes;

        const rows = await sheet.getRows();

        const postalCodeWeSearch = postalCode;

        console.log(postalCodeWeSearch);

        const cityFound = [...rows].filter(row => row._rawData[0] === postalCodeWeSearch)

        if (cityFound.length === 0) {
            const errorNoMatch = `No match for ${postalCodeWeSearch}`;
            throw new Error(errorNoMatch);
        }

        const ownerEmail = cityFound[0]._rawData[2];

        const userData = await getUserData(ownerEmail);

        if (!userData.data) throw new Error(`We could run the the API call to get the user`);

        if (userData.data.results.length === 0) throw new Error(`No CRM user found`);

        const { id } = userData.data.results[0];

        const update = await updateContact(hs_object_id, {
            hubspot_owner_id: id
        }).catch(axiosErrorHandler)


        if (update.data.id) {
            sendResponse(`contact ${hs_object_id} has been assigned to ${ownerEmail}`)
            return;
        }

    } catch (error) {
        console.log("Error ❌ :  ", error)
        sendResponse(error.toString());
    }
};