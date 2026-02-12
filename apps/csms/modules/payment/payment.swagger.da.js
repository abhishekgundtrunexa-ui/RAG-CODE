/**
 * @swagger
 * /payment/preauth:
 *   post:
 *     summary: Pre-authorize a payment transaction
 *     description: Initiates a pre-authorization transaction for a charging session with a specified payment provider (Moneris or Littlepay).
 *     operationId: preauth
 *     tags:
 *       - Payment
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - chargerInfo
 *               - sessionInfo
 *               - cardInfo
 *               - paymentProvider
 *             properties:
 *               paymentProvider:
 *                 type: string
 *                 enum: ["moneris", "littlepay"]
 *                 example: "moneris"
 *               chargerInfo:
 *                 type: object
 *                 required:
 *                   - chargeboxId
 *                   - connectorId
 *                   - serialNumber
 *                 properties:
 *                   chargeboxId:
 *                     type: string
 *                     example: "CGXINPRM2025B46DB8"
 *                   connectorId:
 *                     type: string
 *                     example: "1"
 *                   serialNumber:
 *                     type: string
 *                     example: "755BB70B55814D7A"
 *               sessionInfo:
 *                 type: object
 *                 required:
 *                   - sessionId
 *                   - totalAmount
 *                   - currency
 *                 properties:
 *                   sessionId:
 *                     type: string
 *                     example: "39df6b68-46ab-4338-9169-eec1c8cf2c489"
 *                   totalAmount:
 *                     type: string
 *                     example: "5.00"
 *                   currency:
 *                     type: string
 *                     example: "USD"
 *                   language:
 *                     type: string
 *                     nullable: true
 *                     example: "en"
 *                   langCode:
 *                     type: string
 *                     nullable: true
 *                     example: "en"
 *               cardInfo:
 *                 type: object
 *                 required:
 *                   - pan
 *                   - encryptedTrack2
 *                   - ksn
 *                   - track2
 *                 properties:
 *                   pan:
 *                     type: string
 *                     example: "da39a3ee5e6b4b0d3255"
 *                   encryptedTrack2:
 *                     type: string
 *                     example: "true"
 *                   ksn:
 *                     type: string
 *                     example: "FFFF987654003E400219"
 *                   track2:
 *                     type: string
 *                     example: "A5FD54A8DE3E0334F808C38BEFD70D411FEBE3D75786F8C815A8F20C47F1A4934C29395EFC6387B2DDAAAB5CE9DB599E2F3C0CF76F1FF5E4"
 *                   emvData:
 *                     type: string
 *                     example: "4F07A0000001523010500B444953434F56455220434C5F24032605315F25032408015F280208405F2A0201245F2D02656E5F340101820218008407A00000015230108E0E000000000000000042035E031F03950580000000009601069A032502079B0208009C01009F02060000000010009F03060000000000009F0607A00000015230109F0702FFC09F090200019F100A011520880000000038009F1101019F120B446973636F76657220434C9F150212349F1A0201249F1E0837543331303737329F21030644459F260817FC389913D14D6D9F2701809F2A0200069F3303A068089F34033F00009F3501249F360200599F370454FD58CB9F3901079F4005F0000000009F4104000024979F530820880000000038009F660427ACC0009F7102000FDFEE4C010D"
 *               readerInfo:
 *                 type: object
 *                 required:
 *                   - deviceId
 *                   - deviceType
 *                   - posCode
 *                 properties:
 *                   deviceId:
 *                     type: string
 *                     example: "N0000013"
 *                   deviceType:
 *                     type: string
 *                     example: "idtech_bdk_ctls"
 *                   posCode:
 *                     type: string
 *                     example: "27"
 *     responses:
 *       200:
 *         description: Successful pre-authorization response
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 type:
 *                   type: string
 *                   example: "Preauth"
 *                 chargerInfo:
 *                   type: object
 *                   properties:
 *                     chargeboxId:
 *                       type: string
 *                       example: "CHARGEBOX123"
 *                     connectorId:
 *                       type: integer
 *                       example: 1
 *                 currency:
 *                   type: string
 *                   example: "CAD"
 *                 transactionId:
 *                   type: string
 *                   nullable: true
 *                   example: "TRANS123"
 *                 sessionId:
 *                   type: string
 *                   example: "SESSION123"
 *                 idTag:
 *                   type: string
 *                   example: "IDTAG123"
 *                 amount:
 *                   type: number
 *                   format: float
 *                   example: 10.50
 *                 paymentStatus:
 *                   type: string
 *                   example: "authorized"
 *                 paymentStatusMessage:
 *                   type: string
 *                   example: "Transaction approved"
 *                 timezone:
 *                   type: string
 *                   example: "UTC"
 *                 country:
 *                   type: string
 *                   example: "CA"
 *                 language:
 *                   type: string
 *                   example: "en"
 *                 receiptInfo:
 *                   type: object
 *                   nullable: true
 *                   description: Receipt information for the transaction
 *       400:
 *         description: Bad request due to invalid input
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Payment provider is required."
 * /payment/preauthComplete:
 *   post:
 *     summary: Complete a pre-authorized payment
 *     description: Compleates a pre-authorized payment transaction for a charging session with a specified payment provider.
 *     operationId: preauthComplete
 *     tags:
 *       - Payment
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - chargerInfo
 *               - sessionInfo
 *               - cardInfo
 *               - paymentProvider
 *             properties:
 *               paymentProvider:
 *                 type: string
 *                 enum: ["moneris", "littlepay"]
 *                 example: "moneris"
 *               chargerInfo:
 *                 type: object
 *                 required:
 *                   - chargeboxId
 *                   - connectorId
 *                   - serialNumber
 *                 properties:
 *                   chargeboxId:
 *                     type: string
 *                     example: "CGXINPRM20254197DF"
 *                   connectorId:
 *                     type: string
 *                     example: "1"
 *                   serialNumber:
 *                     type: string
 *                     example: "65F522D4DC7A46CF"
 *               sessionInfo:
 *                 type: object
 *                 required:
 *                   - sessionId
 *                   - totalAmount
 *                   - currency
 *                 properties:
 *                   sessionId:
 *                     type: string
 *                     example: "2bc16a45-428a-40e2-b1e5-38926da2e16"
 *                   totalAmount:
 *                     type: string
 *                     example: "5.00"
 *                   currency:
 *                     type: string
 *                     example: "USD"
 *                   description:
 *                     type: string
 *                     nullable: true
 *                     example: "Charging session for vehicle"
 *                   language:
 *                     type: string
 *                     nullable: true
 *                     example: "en"
 *                   langCode:
 *                     type: string
 *                     nullable: true
 *                     example: "en"
 *               cardInfo:
 *                 type: object
 *                 required:
 *                   - pan
 *                   - encryptedTrack2
 *                   - ksn
 *                   - track2
 *                 properties:
 *                   pan:
 *                     type: string
 *                     example: "da39a3ee5e6b4b0d3255"
 *                   encryptedTrack2:
 *                     type: string
 *                     example: "true"
 *                   ksn:
 *                     type: string
 *                     example: "FFFF987654003E400219"
 *                   track2:
 *                     type: string
 *                     example: "A5FD54A8DE3E0334F808C38BEFD70D411FEBE3D75786F8C815A8F20C47F1A4934C29395EFC6387B2DDAAAB5CE9DB599E2F3C0CF76F1FF5E4"
 *                   emvData:
 *                     type: string
 *                     example: "4F07A0000001523010500B444953434F56455220434C5F24032605315F25032408015F280208405F2A0201245F2D02656E5F340101820218008407A00000015230108E0E000000000000000042035E031F03950580000000009601069A032502079B0208009C01009F02060000000010009F03060000000000009F0607A00000015230109F0702FFC09F090200019F100A011520880000000038009F1101019F120B446973636F76657220434C9F150212349F1A0201249F1E0837543331303737329F21030644459F260817FC389913D14D6D9F2701809F2A0200069F3303A068089F34033F00009F3501249F360200599F370454FD58CB9F3901079F4005F0000000009F4104000024979F530820880000000038009F660427ACC0009F7102000FDFEE4C010D"
 *               readerInfo:
 *                 type: object
 *                 required:
 *                   - deviceId
 *                   - deviceType
 *                   - posCode
 *                 properties:
 *                   deviceId:
 *                     type: string
 *                     example: "N0000013"
 *                   deviceType:
 *                     type: string
 *                     example: "idtech_bdk_ctls"
 *                   posCode:
 *                     type: string
 *                     example: "27"
 *     responses:
 *       200:
 *         description: Successful completion of pre-authorized payment
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 type:
 *                   type: string
 *                   example: "Capture"
 *                 chargerInfo:
 *                   type: object
 *                   properties:
 *                     chargeboxId:
 *                       type: string
 *                       example: "CHARGEBOX123"
 *                     connectorId:
 *                       type: integer
 *                       example: 1
 *                 currency:
 *                   type: string
 *                   example: "CAD"
 *                 transactionId:
 *                   type: string
 *                   example: "TRANS123"
 *                 sessionId:
 *                   type: string
 *                   example: "SESSION123"
 *                 idTag:
 *                   type: string
 *                   example: "IDTAG123"
 *                 amount:
 *                   type: number
 *                   format: float
 *                   example: 10.50
 *                 paymentStatus:
 *                   type: string
 *                   example: "success"
 *                 paymentStatusMessage:
 *                   type: string
 *                   example: "Transaction approved"
 *                 timezone:
 *                   type: string
 *                   example: "UTC"
 *                 country:
 *                   type: string
 *                   example: "CA"
 *                 language:
 *                   type: string
 *                   example: "en"
 *                 receiptInfo:
 *                   type: object
 *                   nullable: true
 *                   description: Receipt information for the transaction
 *       400:
 *         description: Bad request due to invalid input
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Payment provider is required."
 * /payment/preauthCancel:
 *   post:
 *     summary: Cancel a pre-authorized payment
 *     description: Cancels a pre-authorized payment transaction or stores a pending cancellation if no session ID is provided.
 *     operationId: preauthCancel
 *     tags:
 *       - Payment
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - chargerInfo
 *               - sessionInfo
 *               - cardInfo
 *               - paymentProvider
 *             properties:
 *               paymentProvider:
 *                 type: string
 *                 enum: ["moneris", "littlepay"]
 *                 example: "moneris"
 *               chargerInfo:
 *                 type: object
 *                 required:
 *                   - chargeboxId
 *                   - connectorId
 *                   - serialNumber
 *                 properties:
 *                   chargeboxId:
 *                     type: string
 *                     example: "CGXCAPRM2025AD1D86"
 *                   connectorId:
 *                     type: string
 *                     example: "1"
 *                   serialNumber:
 *                     type: string
 *                     example: "B7F4F4AC7CFA4101"
 *               sessionInfo:
 *                 type: object
 *                 required:
 *                   - totalAmount
 *                   - currency
 *                 properties:
 *                   sessionId:
 *                     type: string
 *                     nullable: true
 *                     example: "SESSION123"
 *                   totalAmount:
 *                     type: string
 *                     example: "0.00"
 *                   currency:
 *                     type: string
 *                     example: "USD"
 *                   language:
 *                     type: string
 *                     nullable: true
 *                     example: "en"
 *                   langCode:
 *                     type: string
 *                     nullable: true
 *                     example: "en"
 *               cardInfo:
 *                 type: object
 *                 required:
 *                   - pan
 *                   - encryptedTrack2
 *                   - ksn
 *                   - track2
 *                 properties:
 *                   pan:
 *                     type: string
 *                     example: "35206d54f8099c1424f5"
 *                   encryptedTrack2:
 *                     type: string
 *                     example: "true"
 *                   ksn:
 *                     type: string
 *                     example: "FFFF987654000FA0033D"
 *                   track2:
 *                     type: string
 *                     example: "7AFDC95EE0D1B30ECD5D3CCB2D5A609481F57DE65BA196508D46169A78EB10CD49F4E8911546349E759A9AD0C3E6D4844A9B9BD94D5022F4"
 *                   emvData:
 *                     type: string
 *                     example: "4F07A0000000041010500A4D4344353020763120305F24034912315F25031805015F280200565F2A0201245F340101820219818407A00000000410108E0E000000000000000042035E031F038F01F1950500000080019A032504289B0200009C01009F01009F02060000000050009F03060000000000009F0607A00000000410109F0702FF009F090200029F0D0500000000009F0E0500000000009F0F0500000000009F10120110A00000000000000000000000000000FF9F150255529F16009F1A0201249F1C009F1D080C008000000000009F1E0835543333303738359F21030639249F2608C30D2E224C232A6C9F2701809F2A01029F33030808089F34031F03029F3501249F360200019F370478C865D19F3901079F400500000000009F4104000008569F5B0CDF6008DF6108DF6201DF63A09F6D020001"
 *                   maskedPan:
 *                     type: string
 *                     example: "5413CCCCCCCC0505"
 *                   cardType:
 *                     type: string
 *                     example: "MASTERCARD"
 *               readerInfo:
 *                 type: object
 *                 required:
 *                   - deviceId
 *                   - deviceType
 *                   - posCode
 *                 properties:
 *                   deviceId:
 *                     type: string
 *                     example: "N0000013"
 *                   deviceType:
 *                     type: string
 *                     example: "idtech_bdk_ctls"
 *                   posCode:
 *                     type: string
 *                     example: "27"
 *     responses:
 *       200:
 *         description: Successful cancellation or pending cancellation stored
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 type:
 *                   type: string
 *                   example: "Cancel"
 *                 chargerInfo:
 *                   type: object
 *                   properties:
 *                     chargeboxId:
 *                       type: string
 *                       example: "CHARGEBOX123"
 *                     connectorId:
 *                       type: integer
 *                       example: 1
 *                 currency:
 *                   type: string
 *                   example: "CAD"
 *                 transactionId:
 *                   type: string
 *                   example: "TRANS123"
 *                 sessionId:
 *                   type: string
 *                   example: "SESSION123"
 *                 idTag:
 *                   type: string
 *                   example: "IDTAG123"
 *                 amount:
 *                   type: number
 *                   format: float
 *                   example: 10.50
 *                 paymentStatus:
 *                   type: string
 *                   example: "success"
 *                 paymentStatusMessage:
 *                   type: string
 *                   example: "Transaction cancelled"
 *                 timezone:
 *                   type: string
 *                   example: "UTC"
 *                 country:
 *                   type: string
 *                   example: "CA"
 *                 language:
 *                   type: string
 *                   example: "en"
 *                 receiptInfo:
 *                   type: object
 *                   nullable: true
 *                   description: Receipt information for the transaction
 *       400:
 *         description: Bad request due to invalid input
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Invalid payment provider."
 */
