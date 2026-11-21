import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getUserProfile, updateUserProfile } from '../../services/api';
import { Form, Input, message, Spin } from 'antd';
import PageHeader from '../../components/PageHeader';

const AdminSettings = () => {
  const [profile, setProfile] = useState(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [loading, setLoading] = useState(true);
  const [form] = Form.useForm();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const profileData = await getUserProfile();
        setProfile(profileData);
        form.setFieldsValue(profileData);
      } catch (error) {
        console.error('Error fetching profile:', error);
        message.error('Failed to load profile data. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [form]);

  const onFinish = async (values) => {
    setIsUpdating(true);
    try {
      await updateUserProfile(values);
      message.success('Profile updated successfully!');
      navigate('/admin/profile');
    } catch (error) {
      console.error('Error updating profile:', error);
      message.error('Failed to update profile. Please try again.');
    } finally {
      setIsUpdating(false);
    }
  };

  if (loading) {
    return (
      <div className="py-12 flex flex-col items-center justify-center">
        <Spin size="large" />
        <p className="mt-3 text-sm text-slate-500">Loading settings...</p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl space-y-6">
      <PageHeader
        title="Admin Settings"
        subtitle="Update your profile information and account credentials."
      />

      <Form
        form={form}
        initialValues={profile}
        onFinish={onFinish}
        layout="vertical"
        requiredMark={false}
        className="space-y-6"
      >
        {/* Card 1: Profile Information */}
        <div className="bg-white dark:bg-[#131926] border border-slate-200 dark:border-slate-800 rounded-lg shadow-none overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800">
            <h2 className="text-base font-semibold text-slate-900 dark:text-white">Profile Information</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">Update your name and contact details</p>
          </div>
          <div className="p-6 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Form.Item
                label={<span className="text-xs font-medium text-slate-700 dark:text-slate-300">First Name</span>}
                name="firstName"
                rules={[{ required: true, message: 'Please input your first name' }]}
                className="mb-0"
              >
                <Input placeholder="Enter first name" className="rounded-md" />
              </Form.Item>
              <Form.Item
                label={<span className="text-xs font-medium text-slate-700 dark:text-slate-300">Last Name</span>}
                name="lastName"
                rules={[{ required: true, message: 'Please input your last name' }]}
                className="mb-0"
              >
                <Input placeholder="Enter last name" className="rounded-md" />
              </Form.Item>
            </div>
            <Form.Item
              label={<span className="text-xs font-medium text-slate-700 dark:text-slate-300">Email Address</span>}
              name="email"
              rules={[
                { required: true, message: 'Please input your email' },
                { type: 'email', message: 'Please enter a valid email address' },
              ]}
              className="mb-0"
            >
              <Input placeholder="Enter email address" className="rounded-md" />
            </Form.Item>
          </div>
        </div>

        {/* Card 2: Security & Password */}
        <div className="bg-white dark:bg-[#131926] border border-slate-200 dark:border-slate-800 rounded-lg shadow-none overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800">
            <h2 className="text-base font-semibold text-slate-900 dark:text-white">Change Password</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">Leave blank if you do not wish to change your password</p>
          </div>
          <div className="p-6 space-y-4">
            <Form.Item
              label={<span className="text-xs font-medium text-slate-700 dark:text-slate-300">New Password</span>}
              name="password"
              rules={[{ min: 6, message: 'Password must be at least 6 characters' }]}
              className="mb-0"
            >
              <Input.Password placeholder="Enter new password (optional)" className="rounded-md" />
            </Form.Item>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={() => navigate('/admin/profile')}
            disabled={isUpdating}
            className="px-4 py-2 text-xs font-semibold rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isUpdating}
            className="px-4 py-2 text-xs font-semibold rounded-md bg-[#131926] dark:bg-[#D4FF5E] text-white dark:text-[#131926] disabled:opacity-50 transition-colors cursor-pointer"
          >
            {isUpdating ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </Form>
    </div>
  );
};

export default AdminSettings;
