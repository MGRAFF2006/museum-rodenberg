import React, { useState } from 'react';
import { Lock, Loader2 } from 'lucide-react';
import { useLanguage } from '../../hooks/useLanguage';

interface AdminLoginProps {
  onLogin: (password: string) => Promise<boolean>;
}

export const AdminLogin: React.FC<AdminLoginProps> = ({ onLogin }) => {
  const [password, setPassword] = useState('');
  const [error, setError] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { t } = useLanguage();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(false);

    try {
      const success = await onLogin(password);
      if (!success) {
        setError(true);
      }
    } catch {
      setError(true);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4">
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-xl shadow-lg border border-neutral-200">
        <div className="text-center">
          <div className="inline-flex items-center justify-center p-3 bg-primary-100 rounded-full mb-4">
            <Lock className="h-8 w-8 text-primary-600" />
          </div>
          <h2 className="text-3xl font-serif font-bold text-neutral-900">
            {t('adminTitle')}
          </h2>
          <p className="mt-2 text-sm text-neutral-600">
            {t('museumTitle')}
          </p>
        </div>
        
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="rounded-md shadow-sm -space-y-px">
            <div>
              <label htmlFor="password" title={t('password')} className="sr-only">
                {t('password')}
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                disabled={isLoading}
                className={`appearance-none rounded-md relative block w-full px-3 py-3 border ${
                  error ? 'border-red-500' : 'border-neutral-300'
                } placeholder-neutral-500 text-neutral-900 focus:outline-none focus:ring-primary-500 focus:border-primary-500 focus:z-10 sm:text-sm`}
                placeholder={t('password')}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          {error && (
            <p className="text-red-500 text-sm text-center">
              {t('errorInvalidPassword')}
            </p>
          )}

          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors disabled:opacity-50"
            >
              {isLoading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                t('login')
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
