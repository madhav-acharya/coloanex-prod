import "react-native-get-random-values";
import { Buffer } from "buffer";

global.Buffer = Buffer;

if (typeof global.crypto === "undefined") {
  global.crypto = require("expo-crypto");
}
