/**
 * @swagger
 * /api/language/get-language:
 *   get:
 *     summary: Get language translations
 *     description: |
 *       Fetches language key-value pairs used in the system for different UI contexts (`app` or `nexpay`).
 *       The result is an object where each key maps to translations in English, French, and Spanish.
 *     tags:
 *       - Language
 *     parameters:
 *       - in: query
 *         name: langFor
 *         required: false
 *         schema:
 *           type: string
 *           enum: [app, nexpay]
 *           default: app
 *         description: The target module or context for which the language keys are fetched.
 *     responses:
 *       200:
 *         description: Language key translations
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               additionalProperties:
 *                 type: object
 *                 properties:
 *                   en:
 *                     type: string
 *                     example: "Submit"
 *                   fr:
 *                     type: string
 *                     example: "Soumettre"
 *                   es:
 *                     type: string
 *                     example: "Enviar"
 *       400:
 *         description: Invalid `langFor` value provided
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Only 'app' or 'nexpay' is supported for langFor."
 *       500:
 *         description: Server error while fetching language data
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Internal Server Error"
 */
