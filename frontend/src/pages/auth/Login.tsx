import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import { useAuth } from '@/components/providers/AuthProvider';
import { cn } from '@/utils/cn';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import api from '@/services/api';

const loginSchema = z.object({
  username: z.string().min(1, 'auth.usernameRequired'),
  password: z.string().min(1, 'auth.passwordRequired'),
  rememberMe: z.boolean().optional(),
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function Login() {
  const { t } = useTranslation();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: '',
      password: '',
      rememberMe: false,
    },
  });

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true);
    try {
      const response = await api.post<{
        user: any;
        accessToken: string;
        refreshToken: string;
      }>('/auth/login', {
        username: data.username,
        password: data.password,
      });

      login(response.accessToken, response.refreshToken, response.user);
      navigate('/dashboard');
    } catch (error) {
      console.error('Login failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col items-center gap-2 text-center">
        <div className="flex items-center justify-center rounded-lg bg-primary p-2">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-6 w-6 text-primary-foreground"
          >
            <path d="M3 3v18h18" />
            <path d="m19 9-5 5-4-4-3 3" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold">{t('common.appName')}</h1>
        <p className="text-balance text-sm text-muted-foreground">
          {t('auth.loginSubtitle')}
        </p>
      </div>

      {/* Login Card */}
      <div className="rounded-lg border bg-card text-card-foreground shadow-sm">
        <div className="flex flex-col space-y-1.5 p-6">
          <h3 className="text-2xl font-semibold leading-none tracking-tight">
            {t('auth.signIn')}
          </h3>
          <p className="text-sm text-muted-foreground">
            {t('auth.enterCredentials', 'Enter your credentials to access your account')}
          </p>
        </div>
        <div className="p-6 pt-0">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* Username field */}
            <div className="space-y-2">
              <Label htmlFor="username">{t('auth.username')}</Label>
              <Input
                {...register('username')}
                id="username"
                placeholder={t('auth.usernamePlaceholder', 'Enter your username')}
                autoCapitalize="none"
                autoComplete="username"
                autoCorrect="off"
                disabled={isLoading}
                className={cn(errors.username && 'border-destructive')}
              />
              {errors.username && (
                <p className="text-sm font-medium text-destructive">
                  {t(errors.username.message || '')}
                </p>
              )}
            </div>

            {/* Password field */}
            <div className="space-y-2">
              <div className="flex items-center">
                <Label htmlFor="password">{t('auth.password')}</Label>
                <a
                  href="#"
                  className="ml-auto inline-block text-sm underline-offset-4 hover:underline"
                >
                  {t('auth.forgotPassword')}
                </a>
              </div>
              <div className="relative">
                <Input
                  {...register('password')}
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder={t('auth.passwordPlaceholder', 'Enter your password')}
                  autoComplete="current-password"
                  disabled={isLoading}
                  className={cn(errors.password && 'border-destructive', 'pr-10')}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
              {errors.password && (
                <p className="text-sm font-medium text-destructive">
                  {t(errors.password.message || '')}
                </p>
              )}
            </div>

            {/* Remember me */}
            <div className="flex items-center space-x-2">
              <Checkbox id="remember" {...register('rememberMe')} />
              <label
                htmlFor="remember"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                {t('auth.rememberMe')}
              </label>
            </div>

            {/* Submit button */}
            <Button disabled={isLoading} className="w-full">
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {t('auth.signIn')}
            </Button>
          </form>
        </div>
        <div className="flex items-center p-6 pt-0">
          <p className="text-center text-sm text-muted-foreground w-full">
            {t('auth.noAccount', "Don't have an account?")}{' '}
            <a href="#" className="underline underline-offset-4 hover:text-primary">
              {t('auth.contactAdmin', 'Contact admin')}
            </a>
          </p>
        </div>
      </div>

      {/* Demo credentials */}
      <div className="rounded-lg border bg-card text-card-foreground shadow-sm">
        <div className="flex flex-col space-y-1.5 p-6">
          <h3 className="text-sm font-semibold leading-none tracking-tight text-muted-foreground">
            {t('auth.demoCredentials')}
          </h3>
        </div>
        <div className="p-6 pt-0">
          <div className="grid gap-2 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">{t('auth.username')}:</span>
              <code className="relative rounded bg-muted px-[0.3rem] py-[0.2rem] font-mono text-sm font-semibold">
                admin
              </code>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">{t('auth.password')}:</span>
              <code className="relative rounded bg-muted px-[0.3rem] py-[0.2rem] font-mono text-sm font-semibold">
                admin123
              </code>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <p className="text-center text-xs text-muted-foreground">
        © 2024 Monitor. All rights reserved.
      </p>
    </div>
  );
}
