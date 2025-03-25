// db/index.js
import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
import path from "path";

// Manually load .env.development if in development mode
const envFile = process.env.NODE_ENV === "development" ? ".env.development" : ".env.production";

dotenv.config({ path: path.resolve(process.cwd(), envFile) });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error(`Missing Supabase environment variables. Check ${envFile} file.`);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const connectDB = async () => {
    try {
        // Check Supabase connection with a simple query instead of RPC
        const { data, error } = await supabase.from('urls').select('count', { count: 'exact', head: true });

        if (error) throw error;

        console.log("\n✅ Supabase connected successfully!");
    } catch (error) {
        console.error("❌ Supabase connection ERROR:", error.message);
        process.exit(1);
    }
};

export { supabase, connectDB };