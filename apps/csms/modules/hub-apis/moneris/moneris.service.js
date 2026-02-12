const axios = require("axios");
const fs = require("fs");
const path = require("path");

const req1Template = path.join(__dirname, "req1_template_preauth.xml");
const req2Template = path.join(__dirname, "req2_template_emvdata_add.xml");
const req3Template = path.join(
  __dirname,
  "req3_template_preauth_completion.xml"
);
const API_URL = "https://esqa.moneris.com/gateway2/servlet/MpgRequest";

function generateXmlData(templatePath, replacements) {
  try {
    // Read the XML template
    const xmlData = fs.readFileSync(templatePath, "utf-8");

    // Replace placeholders with actual values
    const replacedXmlData = Object.entries(replacements).reduce(
      (data, [key, value]) => {
        const placeholder = `\\$\\{${key}\\}`; // Escaping `${key}` for RegExp
        const regex = new RegExp(placeholder, "g"); // Create a global regex
        return data.replace(regex, value);
      },
      xmlData
    );

    return replacedXmlData;
  } catch (err) {
    console.error("Error generating XML data:", err.message);
    throw new Error("Failed to generate XML data");
  }
}

exports.sendPreauthRequest = async () => {
  const amount = "21.00";
  const enc_track2 =
    "000000FFFFFF987654003D60006588DF56DFDB9644D2A384EA09EBC7EB34D6AAC1D65A05F59A8DA695F14A0275881F3AD29AF92A3F9E1A33548B755BCEEF2136028893A69DEA";
  const emv_data =
    "4F07A0000000031010500B5649534120435245444954820220008407A0000000031010950500000000009601039A032501169C01005F2A0208405F2D02656E5F3401015F3601029F02060000000021009F03060000000000009F0607A00000000310109F090200029F100706010A03A000009F150200009F1A0208409F1B0400001F409F1E0837543331303737349F21030745489F260853DAB172D47AB0079F2701809F3303E008409F34033F00009F3501159F360200169F37041A836F7B9F3901079F400580000000009F4104000001059F4E1E0000000000000000000000000000000000000000000000000000000000009F5A0531084008409F66042000C0009F6C0238009F6E0420700000DF812606000000006000DFEE4C0106";

  const replacements = {
    store_id: "monca10504",
    api_token: "xJUqtSJX7F0KToUFO96l",
    order_id: `enc-ctls${Date.now()}`,
    amount,
    enc_track2,
    emv_data,
    device_type: "idtech_bdk_ctls",
    pos_code: "27",
    entry_method: "H",
    device_id: "N0000013",
    status_check: "false",
  };

  const xmlData = generateXmlData(req1Template, replacements);

  const response = await axios.post(API_URL, xmlData, {
    headers: { "Content-Type": "text/xml" },
  });

  return response.data;
};

exports.emvDataAddRequest = async () => {
  const replacements = {
    store_id: "monca10504",
    api_token: "xJUqtSJX7F0KToUFO96l",
    order_id: `enc-ctls1737119893808`,
    txn_number: "261-0_1018",
    pan_entry: "H",
    cvm_indicator: "N",
    completion_data: btoa(
      "4F07A0000000031010500B5649534120435245444954820220008407A0000000031010950500000000009601039A032501169C01005F2A0208405F2D02656E5F3401015F3601029F02060000000021009F03060000000000009F0607A00000000310109F090200029F100706010A03A000009F150200009F1A0208409F1B0400001F409F1E0837543331303737349F21030757479F260838F8544BB5A450199F2701809F3303E008409F34033F00009F3501159F360200179F370488BD4C6A9F3901079F400580000000009F4104000001079F4E1E0000000000000000000000000000000000000000000000000000000000009F5A0531084008409F66042000C0009F6C0238009F6E0420700000DF812606000000006000DFEE4C0106"
    ),
  };

  const xmlData = generateXmlData(req2Template, replacements);

  const response = await axios.post(API_URL, xmlData, {
    headers: { "Content-Type": "text/xml" },
  });

  return response.data;
};

exports.emvCompletionRequest = async () => {
  const replacements = {
    store_id: "monca10504",
    api_token: "xJUqtSJX7F0KToUFO96l",
    order_id: `enc-ctls1737119893808`,
    comp_amount: "21.00",
    txn_number: "261-0_1018",
  };

  const xmlData = generateXmlData(req3Template, replacements);

  const response = await axios.post(API_URL, xmlData, {
    headers: { "Content-Type": "text/xml" },
  });

  return response.data;
};
