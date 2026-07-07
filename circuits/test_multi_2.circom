pragma circom 2.1.6;
include "multi_credential.circom";
component main {public [roots]} = MultiCredentialAggregation(2, 10);
