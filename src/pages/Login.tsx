import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { api } from '../api/api';
import { getApiErrorMessage } from '../lib/getApiErrorMessage';
import { useAuth } from '../context/AuthContext';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/atoms/card';
import { Label } from '@/components/atoms/label';
import { Input } from '@/components/atoms/input';
import { Button } from '@/components/atoms/button';
import { AlertCircle } from 'lucide-react';

export const Login: React.FC = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    const navigate = useNavigate();
    const { login } = useAuth();
    const { t } = useTranslation();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setLoading(true);

        try {
            await api.post('/login', { email, password });
            // Token is now stored in HttpOnly cookies by the backend

            // Xong login thì lấy info user
            const meRes = await api.get('/me');
            login(meRes.data.data); // Cập nhật state với Info của User

            navigate('/dashboard', { replace: true });
        } catch (err: unknown) {
            setError(getApiErrorMessage(err, t, 'errors.loginFailed'));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-muted/40 p-4">
            <Card className="w-full max-w-sm shadow-lg">
                <CardHeader className="space-y-1 text-center">
                    <CardTitle className="text-2xl font-bold tracking-tight">{t('auth.login.title')}</CardTitle>
                    <CardDescription>
                        {t('auth.login.subtitle')}
                    </CardDescription>
                </CardHeader>
                <form onSubmit={handleSubmit}>
                    <CardContent className="space-y-4">
                        {error && (
                            <div className="flex items-center gap-2 rounded-md bg-destructive/15 p-3 text-sm text-destructive">
                                <AlertCircle className="h-4 w-4" />
                                <span>{error}</span>
                            </div>
                        )}
                        <div className="space-y-2">
                            <Label htmlFor="email">Email</Label>
                            <Input
                                id="email"
                                type="email"
                                placeholder="name@example.com"
                                required
                                value={email}
                                onChange={e => setEmail(e.target.value)}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="password">{t('auth.login.password')}</Label>
                            <Input
                                id="password"
                                type="password"
                                required
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                            />
                        </div>
                    </CardContent>
                    <CardFooter>
                        <Button
                            type="submit"
                            className="w-full"
                            disabled={loading}
                        >
                            {loading ? t('auth.login.loading') : t('auth.login.button')}
                        </Button>
                    </CardFooter>
                </form>
            </Card>
        </div>
    );
};
