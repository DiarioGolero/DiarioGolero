import { authorized, readJson, writeJson } from "./_lib.js";
import { makeHandler } from "./_comments.js";

export default makeHandler({ authorized, readJson, writeJson });
