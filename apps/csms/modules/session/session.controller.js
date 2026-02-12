const sessionService = require("./session.service");

//Add session
exports.addSession = async (req, res) => {
  try {
    await sessionService.addSession(req.body, req, res);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

//Get single session by Id
exports.getSessionById = async (req, res) => {
  try {
    const sessionId = req.params.sessionId;
    await sessionService.getSessionById(sessionId, req, res);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

//Get session list
exports.getSessionList = async (req, res) => {
  try {
    const chargerId = req.params.chargerId;
    await sessionService.getSessionList(chargerId, req, res);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

//Update session
exports.updateSession = async (req, res) => {
  try {
    const sessionId = req.params.sessionId;
    const payload = req.body;
    await sessionService.updateSession(sessionId, payload, req, res);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

//Soft delete session
exports.deleteSession = async (req, res) => {
  try {
    const sessionId = req.params.sessionId;
    await sessionService.deleteSession(sessionId, req, res);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};
