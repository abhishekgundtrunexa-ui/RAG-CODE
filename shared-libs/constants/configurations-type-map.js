const ConfigurationTypeMap = {
    "AllowOfflineTxForUnknownId": {
        "type": "boolean",
        "readonly": false
    },
    "AuthorizationCacheEnabled": {
        "type": "boolean",
        "readonly": false
    },
    "AuthorizeRemoteTxRequests": {
        "type": "boolean",
        "readonly": false
    },
    "BlinkRepeat": {
        "type": "integer",
        "readonly": false
    },
    "ClockAlignedDataInterval": {
        "type": "integer",
        "readonly": false
    },
    "ConnectionTimeOut": {
        "type": "integer",
        "readonly": false
    },
    "ConnectorPhaseRotation": {
        "type": "CSL",
        "readonly": false
    },
    "ConnectorPhaseRotationMaxLength": {
        "type": "integer",
        "readonly": true
    },
    "GetConfigurationMaxKeys": {
        "type": "integer",
        "readonly": true
    },
    "HeartbeatInterval": {
        "type": "integer",
        "readonly": false
    },
    "LightIntensity": {
        "type": "integer",
        "readonly": false
    },
    "LocalAuthorizeOffline": {
        "type": "boolean",
        "readonly": false
    },
    "LocalPreAuthorize": {
        "type": "boolean",
        "readonly": false
    },
    "MaxEnergyOnInvalidId": {
        "type": "integer",
        "readonly": false
    },
    "MeterValuesAlignedData": {
        "type": "CSL",
        "readonly": false
    },
    "MeterValuesAlignedDataMaxLength": {
        "type": "integer",
        "readonly": true
    },
    "MeterValuesSampledData": {
        "type": "CSL",
        "readonly": false
    },
    "MeterValuesSampledDataMaxLength": {
        "type": "integer",
        "readonly": true
    },
    "MeterValueSampleInterval": {
        "type": "integer",
        "readonly": false
    },
    "MinimumStatusDuration": {
        "type": "integer",
        "readonly": false
    },
    "NumberOfConnectors": {
        "type": "integer",
        "readonly": true
    },
    "ResetRetries": {
        "type": "integer",
        "readonly": false
    },
    "StopTransactionOnEVSideDisconnect": {
        "type": "boolean",
        "readonly": false
    },
    "StopTransactionOnInvalidId": {
        "type": "boolean",
        "readonly": false
    },
    "StopTxnAlignedData": {
        "type": "CSL",
        "readonly": false
    },
    "StopTxnAlignedDataMaxLength": {
        "type": "integer",
        "readonly": true
    },
    "StopTxnSampledData": {
        "type": "CSL",
        "readonly": false
    },
    "StopTxnSampledDataMaxLength": {
        "type": "integer",
        "readonly": true
    },
    "SupportedFeatureProfiles": {
        "type": "CSL",
        "readonly": true
    },
    "SupportedFeatureProfilesMaxLength": {
        "type": "integer",
        "readonly": true
    },
    "TransactionMessageAttempts": {
        "type": "integer",
        "readonly": false
    },
    "TransactionMessageRetryInterval": {
        "type": "integer",
        "readonly": false
    },
    "UnlockConnectorOnEVSideDisconnect": {
        "type": "boolean",
        "readonly": false
    },
    "WebSocketPingInterval": {
        "type": "integer",
        "readonly": false
    },
    "LocalAuthListEnabled": {
        "type": "boolean",
        "readonly": false
    },
    "LocalAuthListMaxLength": {
        "type": "integer",
        "readonly": true
    },
    "SendLocalListMaxLength": {
        "type": "integer",
        "readonly": true
    },
    "ReserveConnectorZeroSupported": {
        "type": "boolean",
        "readonly": true
    },
    "ChargeProfileMaxStackLevel": {
        "type": "integer",
        "readonly": true
    },
    "ChargingScheduleAllowedChargingRateUnit": {
        "type": "CSL",
        "readonly": true
    },
    "ChargingScheduleMaxPeriods": {
        "type": "integer",
        "readonly": true
    },
    "ConnectorSwitch3to1PhaseSupported": {
        "type": "boolean",
        "readonly": true
    },
    "MaxChargingProfilesInstalled": {
        "type": "integer",
        "readonly": true
    }
}

module.exports = { ConfigurationTypeMap };