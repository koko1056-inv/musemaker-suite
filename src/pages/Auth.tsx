import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Mail, Lock, User, Eye, EyeOff, Mic } from "lucide-react";
import { z } from "zod";
import musaLogo from "@/assets/musa-logo.png";

const emailSchema = z.string().email("有効なメールアドレスを入力してください");
const passwordSchema = z.string().min(6, "パスワードは6文字以上で入力してください");

const Auth = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<{
    email?: string;
    password?: string;
  }>({});

  const validateForm = () => {
    const newErrors: {
      email?: string;
      password?: string;
    } = {};
    const emailResult = emailSchema.safeParse(email);
    if (!emailResult.success) {
      newErrors.email = emailResult.error.errors[0].message;
    }
    const passwordResult = passwordSchema.safeParse(password);
    if (!passwordResult.success) {
      newErrors.password = passwordResult.error.errors[0].message;
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password
      });
      if (error) {
        if (error.message.includes("Invalid login credentials")) {
          toast({
            variant: "destructive",
            title: "ログインエラー",
            description: "メールアドレスまたはパスワードが正しくありません。"
          });
        } else {
          toast({
            variant: "destructive",
            title: "ログインエラー",
            description: error.message
          });
        }
        return;
      }
      toast({
        title: "ログイン成功",
        description: "ダッシュボードにリダイレクトします。"
      });
      navigate("/");
    } catch (error) {
      toast({
        variant: "destructive",
        title: "エラー",
        description: "予期しないエラーが発生しました。"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    setIsLoading(true);
    try {
      const redirectUrl = `${window.location.origin}/`;
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: redirectUrl,
          data: {
            full_name: fullName
          }
        }
      });
      if (error) {
        if (error.message.includes("already registered")) {
          toast({
            variant: "destructive",
            title: "登録エラー",
            description: "このメールアドレスは既に登録されています。ログインしてください。"
          });
        } else {
          toast({
            variant: "destructive",
            title: "登録エラー",
            description: error.message
          });
        }
        return;
      }
      toast({
        title: "登録完了",
        description: "アカウントが作成されました。ダッシュボードにリダイレクトします。"
      });
      navigate("/");
    } catch (error) {
      toast({
        variant: "destructive",
        title: "エラー",
        description: "予期しないエラーが発生しました。"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Gradient orbs */}
        <div className="absolute top-1/4 -left-32 w-96 h-96 bg-gradient-to-br from-foreground/5 to-transparent rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-gradient-to-tl from-foreground/5 to-transparent rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-gradient-radial from-foreground/[0.02] to-transparent rounded-full" />
        
        {/* Grid pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,hsl(var(--border)/0.3)_1px,transparent_1px),linear-gradient(to_bottom,hsl(var(--border)/0.3)_1px,transparent_1px)] bg-[size:64px_64px]" />
      </div>

      <div className="relative z-10 w-full max-w-md px-6">
        {/* Logo Section */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center mb-6">
            <img 
              src={musaLogo} 
              alt="MUSA" 
              className="h-20 w-auto drop-shadow-lg"
            />
          </div>
          <p className="text-muted-foreground text-sm">
            AIボイスエージェントプラットフォーム
          </p>
        </div>

        {/* Main Card */}
        <div className="bg-card/80 backdrop-blur-xl border border-border rounded-3xl shadow-2xl overflow-hidden">
          <Tabs defaultValue="login" className="w-full">
            <div className="px-8 pt-8">
              <TabsList className="grid w-full grid-cols-2 h-14 p-1.5 bg-muted/50 rounded-2xl">
                <TabsTrigger 
                  value="login" 
                  className="text-sm font-semibold data-[state=active]:bg-background data-[state=active]:shadow-lg rounded-xl transition-all duration-300"
                >
                  ログイン
                </TabsTrigger>
                <TabsTrigger 
                  value="signup" 
                  className="text-sm font-semibold data-[state=active]:bg-background data-[state=active]:shadow-lg rounded-xl transition-all duration-300"
                >
                  新規登録
                </TabsTrigger>
              </TabsList>
            </div>

            <div className="p-8 pt-6">
              <TabsContent value="login" className="mt-0">
                <form onSubmit={handleLogin} className="space-y-5">
                  <div className="space-y-2">
                    <Label htmlFor="login-email" className="flex items-center gap-2 text-sm font-medium text-foreground/80">
                      <Mail className="h-4 w-4" />
                      メールアドレス
                    </Label>
                    <div className="relative group">
                      <Input
                        id="login-email"
                        type="email"
                        placeholder="example@company.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        disabled={isLoading}
                        className="h-12 pl-4 pr-4 bg-muted/30 border-border/50 rounded-xl text-base placeholder:text-muted-foreground/50 focus:bg-background focus:border-foreground/20 focus:ring-2 focus:ring-foreground/10 transition-all duration-200"
                      />
                    </div>
                    {errors.email && (
                      <p className="text-sm text-destructive flex items-center gap-1 mt-1">
                        {errors.email}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="login-password" className="flex items-center gap-2 text-sm font-medium text-foreground/80">
                      <Lock className="h-4 w-4" />
                      パスワード
                    </Label>
                    <div className="relative group">
                      <Input
                        id="login-password"
                        type={showPassword ? "text" : "password"}
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        disabled={isLoading}
                        className="h-12 pl-4 pr-12 bg-muted/30 border-border/50 rounded-xl text-base placeholder:text-muted-foreground/50 focus:bg-background focus:border-foreground/20 focus:ring-2 focus:ring-foreground/10 transition-all duration-200"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                      >
                        {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                      </button>
                    </div>
                    {errors.password && (
                      <p className="text-sm text-destructive flex items-center gap-1 mt-1">
                        {errors.password}
                      </p>
                    )}
                  </div>

                  <Button
                    type="submit"
                    className="w-full h-12 text-base font-semibold rounded-xl bg-foreground text-background hover:bg-foreground/90 transition-all duration-300 shadow-lg hover:shadow-xl hover:-translate-y-0.5"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                        ログイン中...
                      </>
                    ) : (
                      "ログイン"
                    )}
                  </Button>
                </form>
              </TabsContent>

              <TabsContent value="signup" className="mt-0">
                <form onSubmit={handleSignUp} className="space-y-5">
                  <div className="space-y-2">
                    <Label htmlFor="signup-name" className="flex items-center gap-2 text-sm font-medium text-foreground/80">
                      <User className="h-4 w-4" />
                      氏名
                    </Label>
                    <div className="relative group">
                      <Input
                        id="signup-name"
                        type="text"
                        placeholder="山田 太郎"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        disabled={isLoading}
                        className="h-12 pl-4 pr-4 bg-muted/30 border-border/50 rounded-xl text-base placeholder:text-muted-foreground/50 focus:bg-background focus:border-foreground/20 focus:ring-2 focus:ring-foreground/10 transition-all duration-200"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="signup-email" className="flex items-center gap-2 text-sm font-medium text-foreground/80">
                      <Mail className="h-4 w-4" />
                      メールアドレス
                    </Label>
                    <div className="relative group">
                      <Input
                        id="signup-email"
                        type="email"
                        placeholder="example@company.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        disabled={isLoading}
                        className="h-12 pl-4 pr-4 bg-muted/30 border-border/50 rounded-xl text-base placeholder:text-muted-foreground/50 focus:bg-background focus:border-foreground/20 focus:ring-2 focus:ring-foreground/10 transition-all duration-200"
                      />
                    </div>
                    {errors.email && (
                      <p className="text-sm text-destructive flex items-center gap-1 mt-1">
                        {errors.email}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="signup-password" className="flex items-center gap-2 text-sm font-medium text-foreground/80">
                      <Lock className="h-4 w-4" />
                      パスワード
                    </Label>
                    <div className="relative group">
                      <Input
                        id="signup-password"
                        type={showPassword ? "text" : "password"}
                        placeholder="6文字以上"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        disabled={isLoading}
                        className="h-12 pl-4 pr-12 bg-muted/30 border-border/50 rounded-xl text-base placeholder:text-muted-foreground/50 focus:bg-background focus:border-foreground/20 focus:ring-2 focus:ring-foreground/10 transition-all duration-200"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                      >
                        {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                      </button>
                    </div>
                    {errors.password && (
                      <p className="text-sm text-destructive flex items-center gap-1 mt-1">
                        {errors.password}
                      </p>
                    )}
                  </div>

                  <Button
                    type="submit"
                    className="w-full h-12 text-base font-semibold rounded-xl bg-foreground text-background hover:bg-foreground/90 transition-all duration-300 shadow-lg hover:shadow-xl hover:-translate-y-0.5"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                        登録中...
                      </>
                    ) : (
                      "アカウントを作成"
                    )}
                  </Button>
                </form>
              </TabsContent>
            </div>
          </Tabs>
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-muted-foreground mt-8">
          ログインすることで、利用規約とプライバシーポリシーに同意したものとみなされます。
        </p>
      </div>
    </div>
  );
};

export default Auth;
