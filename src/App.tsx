import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient,QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter,Routes,Route } from "react-router-dom";
import { LanguageProvider } from "@/i18n/LanguageContext";
import { AccessGate,AccountNav,ProfilePage,ResetPassword } from "@/components/Account";
import Index from "./pages/Index";
import History from "./pages/History";
import NotFound from "./pages/NotFound";
const client=new QueryClient();
export default function App(){return <QueryClientProvider client={client}><LanguageProvider><TooltipProvider><Toaster/><Sonner/><BrowserRouter><AccessGate><AccountNav/><Routes><Route path="/" element={<Index/>}/><Route path="/profile" element={<ProfilePage/>}/><Route path="/history" element={<History/>}/><Route path="/reset-password" element={<ResetPassword/>}/><Route path="*" element={<NotFound/>}/></Routes></AccessGate></BrowserRouter></TooltipProvider></LanguageProvider></QueryClientProvider>;}
