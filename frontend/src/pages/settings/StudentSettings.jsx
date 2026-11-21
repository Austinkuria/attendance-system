import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getUserProfile, updateUserProfile } from '../../services/api';
import { Form, Input, message, Spin } from 'antd';
import PageHeader from '../../components/PageHeader';

const StudentSettings = () => {
  const [profile, setProfile] = useState(null);
  const [submitting, setSubmitting] = useState(false);
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
    setSubmitting(true);
    try {
      await updateUserProfile(values);
      message.success('Profile updated successfully!');
      navigate('/student/profile');
    } catch (error) {
      console.error('Error updating profile:', error);
      message.error('Failed to update profile. Please try again.');
    } finally {
      setSubmitting(false);
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
        title="Student Settings"
        subtitle="Manage your profile details and account security settings."
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
        <div className="bg-white border border-slate-200 rounded-lg shadow-2xs overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-200">
            <h2 className="text-base font-semibold text-slate-900">Profile Information</h2>
            <p className="text-xs text-slate-500">Your registered student identity details</p>
          </div>
          <div className="p-6 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Form.Item
                label={<span className="text-xs font-medium text-slate-700">First Name</span>}
                name="firstName"
                rules={[{ required: true, message: 'Please input your first name' }]}
                className="mb-0"
              >
                <Input placeholder="Enter first name" className="rounded-md" />
              </Form.Item>
              <Form.Item
                label={<span className="text-xs font-medium text-slate-700">Last Name</span>}
                name="lastName"
                rules={[{ required: true, message: 'Please input your last name' }]}
                className="mb-0"
              >
                <Input placeholder="Enter last name" className="rounded-md" />
              </Form.Item>
            </div>
            <Form.Item
              label={<span className="text-xs font-medium text-slate-700">Email Address</span>}
              name="email"
              rules={[
                { required: true, message: 'Please input your email' },
                { type: 'email', message: 'Please enter a valid email address' },
              ]}
              className="mb-0"
            >
              <Input placeholder="Enter email address" disabled className="rounded-md bg-slate-50 text-slate-500 cursor-not-allowed" />
            </Form.Item>
          </div>
        </div>

        {/* Card 2: Security & Password */}
        <div className="bg-white border border-slate-200 rounded-lg shadow-2xs overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-200">
            <h2 className="text-base font-semibold text-slate-900">Change Password</h2>
            <p className="text-xs text-slate-500">Leave blank if you do not wish to change your password</p>
          </div>
          <div className="p-6 space-y-4">
            <Form.Item
              label={<span className="text-xs font-medium text-slate-700">New Password</span>}
              name="password"
              rules={[
                { min: 8, message: 'Password must be at least 8 characters long' },
                { pattern: /[A-Z]/, message: 'Password must contain at least 1 uppercase letter' },
                { pattern: /[0-9]/, message: 'Password must contain at least 1 number' },
              ]}
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
            onClick={() => navigate('/student/profile')}
            disabled={submitting}
            className="px-4 py-2 text-sm font-medium rounded-md border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="px-4 py-2 text-sm font-medium rounded-md bg-slate-900 hover:bg-slate-800 text-white disabled:opacity-50 transition-colors"
          >
            {submitting ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </Form>
    </div>
  );
};

export default StudentSettings;
