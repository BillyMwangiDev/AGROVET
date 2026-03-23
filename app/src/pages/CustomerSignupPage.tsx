import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { signup } from '@/api/auth';

const schema = z.object({
  first_name: z.string().min(1, 'First name required'),
  last_name: z.string().min(1, 'Last name required'),
  username: z.string().min(3, 'Username must be at least 3 characters'),
  email: z.string().email('Invalid email address'),
  phone: z.string().optional(),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string(),
}).refine((d) => d.password === d.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

type FormData = z.infer<typeof schema>;

export default function CustomerSignupPage() {
  const navigate = useNavigate();
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: FormData) => {
    try {
      const { confirmPassword, ...payload } = data;
      await signup(payload);
      toast.success('Account created! You can now log in.');
      navigate('/login');
    } catch (err: any) {
      const msg = err.response?.data;
      if (typeof msg === 'object') {
        const first = Object.values(msg).flat()[0];
        toast.error(String(first));
      } else {
        toast.error('Failed to create account. Please try again.');
      }
    }
  };

  return (
    <div className="min-h-screen bg-[#F6F7F6] flex items-center justify-center px-4">
      <title>Create Account | Nicmah Agrovet</title>
      <meta name="robots" content="noindex, nofollow" />
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <img src="/logo.png" alt="Nicmah Agrovet" className="h-16 w-16 rounded-full object-contain" />
          </div>
          <h1 className="text-2xl font-bold text-[#111915]">Create Account</h1>
          <p className="text-[#6B7A72] mt-1 text-sm">Join AGROVET as a customer</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>First Name</Label>
                <Input {...register('first_name')} placeholder="First name" className="mt-1" />
                {errors.first_name && <p className="text-xs text-red-500 mt-1">{errors.first_name.message}</p>}
              </div>
              <div>
                <Label>Last Name</Label>
                <Input {...register('last_name')} placeholder="Last name" className="mt-1" />
                {errors.last_name && <p className="text-xs text-red-500 mt-1">{errors.last_name.message}</p>}
              </div>
            </div>

            <div>
              <Label>Username</Label>
              <Input {...register('username')} placeholder="Choose a username" className="mt-1" />
              {errors.username && <p className="text-xs text-red-500 mt-1">{errors.username.message}</p>}
            </div>

            <div>
              <Label>Email</Label>
              <Input {...register('email')} type="email" placeholder="your@email.com" className="mt-1" />
              {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email.message}</p>}
            </div>

            <div>
              <Label>Phone (optional)</Label>
              <Input {...register('phone')} placeholder="+254 7XX XXX XXX" className="mt-1" />
            </div>

            <div>
              <Label>Password</Label>
              <Input {...register('password')} type="password" placeholder="Min 8 characters" className="mt-1" />
              {errors.password && <p className="text-xs text-red-500 mt-1">{errors.password.message}</p>}
            </div>

            <div>
              <Label>Confirm Password</Label>
              <Input {...register('confirmPassword')} type="password" placeholder="Repeat password" className="mt-1" />
              {errors.confirmPassword && <p className="text-xs text-red-500 mt-1">{errors.confirmPassword.message}</p>}
            </div>

            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-[#0B3A2C] hover:bg-[#0B3A2C]/90 mt-2"
            >
              {isSubmitting ? 'Creating Account...' : 'Create Account'}
            </Button>
          </form>

          <div className="mt-6 text-center space-y-3">
            <p className="text-sm text-[#6B7A72]">
              Already have an account?{' '}
              <Link to="/login" className="text-[#0B3A2C] font-medium hover:underline">
                Sign in
              </Link>
            </p>
            <Link
              to="/"
              className="inline-flex items-center gap-1 text-sm text-[#6B7A72] hover:text-[#0B3A2C]"
            >
              <ArrowLeft className="w-3 h-3" />
              Back to home
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
