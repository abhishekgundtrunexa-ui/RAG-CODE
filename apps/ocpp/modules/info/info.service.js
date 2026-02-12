const os = require("os");
const https = require("https");
const axios = require("axios");
const fs = require("fs");
const process = require("process");

// Function to fetch TLS certificate details
const getCertificateDetails = async (host) => {
  return new Promise((resolve, reject) => {
    const options = {
      host: host,
      port: 443,
      method: "GET",
    };

    const req = https.request(options, (res) => {
      const cert = res.socket.getPeerCertificate();
      if (!cert || Object.keys(cert).length === 0) {
        return reject(new Error("The website did not provide a certificate."));
      }

      const validTo = new Date(cert.valid_to);
      const daysToExpiry = Math.floor(
        (validTo - new Date()) / (1000 * 60 * 60 * 24)
      );

      resolve({
        subject: cert.subject,
        issuer: cert.issuer,
        validFrom: cert.valid_from,
        validTo: cert.valid_to,
        daysToExpiry,
        isValid: daysToExpiry > 0, // Certificate validity
      });
    });

    req.on("error", (err) => {
      reject(err);
    });

    req.end();
  });
};

// Function to get disk usage
const getDiskUsage = (drivePath) => {
  return new Promise((resolve, reject) => {
    fs.stat(drivePath, (err, stats) => {
      if (err) {
        return reject(new Error("Failed to fetch disk info: " + err.message));
      }

      // Simulating disk space calculation (as a fallback, not accurate)
      const totalDiskSpace = os.totalmem(); // Mock as total memory (adjust for a more realistic calculation)
      const freeDiskSpace = os.freemem(); // Mock as free memory

      resolve({
        total: totalDiskSpace,
        free: freeDiskSpace,
        used: totalDiskSpace - freeDiskSpace,
        status:
          freeDiskSpace > 100 * 1024 * 1024 ? "Healthy" : "Low Disk Space",
      });
    });
  });
};

// Function to check external service health
const getExternalServiceHealth = async (url) => {
  try {
    await axios.get(url);
    return "Healthy";
  } catch {
    return "Unhealthy";
  }
};

// const getInfo = async (req, res) => {
//   try {
//     // Extract the host dynamically from the request headers
//     const host = req.headers.host.split(":")[0]; // Remove port if present
//     const protocol = req.protocol; // Check if HTTP or HTTPS

//     // Check if it's using HTTPS
//     // if (protocol !== "https") {
//     //   return res.status(400).json({
//     //     error: "Certificate details can only be fetched for HTTPS connections",
//     //   });
//     // }

//     // Fetch all health details
//     const [diskDetails, googleHealth] = await Promise.all([
//       // getCertificateDetails(host), // Use dynamic host
//       getDiskUsage("/"),
//       getExternalServiceHealth("https://www.google.com"),
//     ]);

//     const cpuLoad = os.loadavg()[0];
//     const cpuHealth = cpuLoad < os.cpus().length ? "Healthy" : "Overloaded";
//     const memoryHealth =
//       os.freemem() / os.totalmem() < 0.1 ? "Unhealthy" : "Healthy";

//     // Combine results into a health check response
//     const healthCheck = {
//       status: "Healthy",
//       checks: {
//         appHealth: process.uptime() > 0 ? "Healthy" : "Unhealthy",
//         diskHealth: diskDetails.status,
//         externalServices: {
//           google: googleHealth,
//         },
//         cpuHealth,
//         memoryHealth,
//         // certificateHealth: certificateDetails.isValid ? "Healthy" : "Unhealthy",
//       },
//       // details: {
//       //   certificate: {
//       //     subject: certificateDetails.subject,
//       //     issuer: certificateDetails.issuer,
//       //     validFrom: certificateDetails.validFrom,
//       //     validTo: certificateDetails.validTo,
//       //     daysToExpiry: certificateDetails.daysToExpiry,
//       //   },
//       // },
//     };

//     // Mark overall status as 'Unhealthy' if any check fails
//     if (Object.values(healthCheck.checks).includes("Unhealthy")) {
//       healthCheck.status = "Unhealthy";
//     }

//     res.json(healthCheck);
//   } catch (error) {
//     res.status(500).json({
//       error: "Failed to fetch health check details",
//       details: error.message,
//     });
//   }
// };

// const getInfo = async (req, res) => {
//   const serverInfo = {
//     system: {
//       uptime: os.uptime(),
//       loadAverage: os.loadavg(),
//       totalMemory: os.totalmem(),
//       freeMemory: os.freemem(),
//       memoryUsage: ((1 - os.freemem() / os.totalmem()) * 100).toFixed(2),
//       cpu: {
//         model: os.cpus()[0].model,
//         speed: `${os.cpus()[0].speed} MHz`,
//         cores: os.cpus().length,
//         usage: "N/A", // Use the previously shared method for CPU usage
//       },
//       os: {
//         platform: os.platform(),
//         version: os.version(),
//         architecture: os.arch(),
//         hostname: os.hostname(),
//       },
//       networkInterfaces: os.networkInterfaces(),
//     },
//     app: {
//       nodeVersion: process.version,
//       pid: process.pid,
//       uptime: process.uptime(),
//       workingDirectory: process.cwd(),
//       environment: process.env.NODE_ENV || "development",
//     },
//   };

//   res.json(serverInfo);
// };

// Function to get server information
const getServerInfo = () => {
  const cpus = os.cpus();
  const cpuUsage = cpus.map((cpu) => {
    const totalTime = Object.values(cpu.times).reduce(
      (acc, time) => acc + time,
      0
    );
    const idleTime = cpu.times.idle;
    const usagePercentage = ((totalTime - idleTime) / totalTime) * 100;

    return {
      model: cpu.model,
      speed: `${cpu.speed} MHz`,
      usagePercentage: `${usagePercentage.toFixed(2)}%`,
      times: cpu.times,
    };
  });

  const memoryUsage = {
    totalMemory: `${(os.totalmem() / 1024 ** 3).toFixed(2)} GB`,
    freeMemory: `${(os.freemem() / 1024 ** 3).toFixed(2)} GB`,
    usedMemory: `${((os.totalmem() - os.freemem()) / 1024 ** 3).toFixed(2)} GB`,
    memoryUsagePercentage: `${(
      (1 - os.freemem() / os.totalmem()) *
      100
    ).toFixed(2)}%`,
  };

  const loadAverage = os.loadavg(); // Load average for 1, 5, and 15 minutes

  const uptime = {
    systemUptime: `${(os.uptime() / 3600).toFixed(2)} hours`,
    processUptime: `${(process.uptime() / 3600).toFixed(2)} hours`,
  };

  const networkInterfaces = os.networkInterfaces();
  const formattedNetworkInterfaces = Object.entries(networkInterfaces).reduce(
    (acc, [key, value]) => {
      acc[key] = value.map((info) => ({
        address: info.address,
        netmask: info.netmask,
        family: info.family,
        mac: info.mac,
        internal: info.internal,
      }));
      return acc;
    },
    {}
  );

  const nodeProcessInfo = {
    pid: process.pid,
    memoryUsage: process.memoryUsage(),
    version: process.version,
    platform: process.platform,
    argv: process.argv,
    cwd: process.cwd(),
    execPath: process.execPath,
    // env: process.env,
  };

  const osInfo = {
    hostname: os.hostname(),
    platform: os.platform(),
    release: os.release(),
    type: os.type(),
    arch: os.arch(),
    tmpDir: os.tmpdir(),
    endianness: os.endianness(),
    userInfo: os.userInfo(),
  };

  return {
    cpuUsage,
    loadAverage: {
      "1min": loadAverage[0],
      "5min": loadAverage[1],
      "15min": loadAverage[2],
    },
    memoryUsage,
    uptime,
    networkInterfaces: formattedNetworkInterfaces,
    nodeProcessInfo,
    osInfo,
  };
};

const getInfo = async (req, res) => {
  const serverInfo = getServerInfo();
  res.json(serverInfo);
};

module.exports = {
  getInfo,
};
