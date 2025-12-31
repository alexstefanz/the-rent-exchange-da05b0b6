import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, CheckCircle, XCircle, Database } from "lucide-react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";

const DebugSupabase = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string; data?: unknown } | null>(null);

  const testConnection = async () => {
    setIsLoading(true);
    setResult(null);

    try {
      // Test by querying the products table
      const { data, error } = await supabase
        .from("products")
        .select("id, title")
        .limit(5);

      if (error) {
        setResult({
          success: false,
          message: `Eroare la conectare: ${error.message}`,
        });
      } else {
        setResult({
          success: true,
          message: `Conexiune reușită! Am găsit ${data?.length || 0} produse.`,
          data: data,
        });
      }
    } catch (error) {
      setResult({
        success: false,
        message: `Eroare neașteptată: ${error instanceof Error ? error.message : "Unknown error"}`,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const testProfiles = async () => {
    setIsLoading(true);
    setResult(null);

    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, full_name")
        .limit(5);

      if (error) {
        setResult({
          success: false,
          message: `Eroare la profiles: ${error.message}`,
        });
      } else {
        setResult({
          success: true,
          message: `Tabela profiles funcționează! Am găsit ${data?.length || 0} profile.`,
          data: data,
        });
      }
    } catch (error) {
      setResult({
        success: false,
        message: `Eroare neașteptată: ${error instanceof Error ? error.message : "Unknown error"}`,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      
      <main className="flex-1 container max-w-2xl py-8 pt-24 lg:pt-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              Debug Backend Connection
            </CardTitle>
            <CardDescription>
              Testează conexiunea cu backend-ul
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-4">
            <div className="flex gap-4">
              <Button onClick={testConnection} disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Se testează...
                  </>
                ) : (
                  "Test Products Table"
                )}
              </Button>
              
              <Button onClick={testProfiles} disabled={isLoading} variant="outline">
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Se testează...
                  </>
                ) : (
                  "Test Profiles Table"
                )}
              </Button>
            </div>
            
            {result && (
              <div className={`p-4 rounded-lg ${result.success ? "bg-green-50 border border-green-200" : "bg-red-50 border border-red-200"}`}>
                <div className="flex items-center gap-2 mb-2">
                  {result.success ? (
                    <CheckCircle className="h-5 w-5 text-green-600" />
                  ) : (
                    <XCircle className="h-5 w-5 text-red-600" />
                  )}
                  <span className={`font-medium ${result.success ? "text-green-700" : "text-red-700"}`}>
                    {result.success ? "Succes" : "Eroare"}
                  </span>
                </div>
                <p className={result.success ? "text-green-600" : "text-red-600"}>
                  {result.message}
                </p>
                {result.data && (
                  <pre className="mt-2 p-2 bg-background rounded text-xs overflow-auto">
                    {JSON.stringify(result.data, null, 2)}
                  </pre>
                )}
              </div>
            )}
            
            <div className="pt-4 border-t">
              <h3 className="font-medium mb-2">Environment Status:</h3>
              <ul className="text-sm space-y-1">
                <li className="flex items-center gap-2">
                  {import.meta.env.VITE_SUPABASE_URL ? (
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  ) : (
                    <XCircle className="h-4 w-4 text-red-600" />
                  )}
                  VITE_SUPABASE_URL: {import.meta.env.VITE_SUPABASE_URL ? "Configured" : "Missing"}
                </li>
                <li className="flex items-center gap-2">
                  {import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ? (
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  ) : (
                    <XCircle className="h-4 w-4 text-red-600" />
                  )}
                  VITE_SUPABASE_PUBLISHABLE_KEY: {import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ? "Configured" : "Missing"}
                </li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </main>
      
      <Footer />
    </div>
  );
};

export default DebugSupabase;
