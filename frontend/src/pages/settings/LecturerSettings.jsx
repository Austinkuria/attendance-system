import { useEffect, useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { getUserProfile, updateUserProfile } from '../../services/api';
import { Form, Input, message, Spin } from 'antd';
import { ThemeContext } from '../../context/ThemeContext';

/**
 * QRollCall Lecturer Settings
 * Complies strictly with UI Craft & Anti-Slop Design Rules:
 * - rounded-lg cards with 1px hairline border, shadow-none
 * - rounded-md controls (h-9 primary inputs/buttons)
 * - Name breakdown into First, Middle, and Last name
 * - Direct ThemeContext bindings via CSS variables
 */
const LecturerSettings = () => {
  const { isDarkMode, getCardStyle, getSubtleStyle, getInputStyle } = useContext(ThemeContext);
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    let isMounted = true;
    const fetchUserData = async () => {
      try {
        setLoadingProfile(true);
        const userData = await getUserProfile();
        if (isMounted) {
          form.setFieldsValue({
            firstName: userData.firstName || '',
            middleName: userData.middleName || '',
            lastName: userData.lastName || '',
            email: userData.email || '',
            phone: userData.phone || '',
            department: userData.department || 'Software Engineering',
          });
        }
      } catch (error) {
        console.error('Error fetching profile:', error);
        message.error('Failed to load profile data');
      } finally {
        if (isMounted) setLoadingProfile(false);
      }
    };

    fetchUserData();
    return () => {
      isMounted = false;
    };
  }, [form]);

  const handleSubmit = async (values) => {
    try {
      setLoading(true);
      await updateUserProfile(values);
      message.success('Profile updated successfully');
      navigate('/lecturer/overview');
    } catch (error) {
      console.error('Error updating profile:', error);
      message.error('Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  if (loadingProfile) {
    return (
      <div className="py-12 flex flex-col items-center justify-center">
        <Spin size="large" />
        <p className="mt-3 text-xs text-slate-500">Loading settings...</p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl space-y-6">
      {/* Compact PageHeader */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1
            className="text-xl font-semibold tracking-tight"
            style={{ color: isDarkMode ? '#FFFFFF' : '#0F172A' }}
          >
            Lecturer Settings
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Manage your personal academic identity and account credentials.
          </p>
        </div>

        <button
          type="button"
          onClick={() => navigate('/lecturer/overview')}
          className="h-9 px-3.5 rounded-md border text-xs font-medium cursor-pointer transition-colors"
          style={getSubtleStyle()}
        >
          Back to Overview
        </button>
      </div>

      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
        requiredMark={false}
        className="space-y-4"
      >
        {/* Card 1: Profile Information */}
        <div
          className="rounded-lg border p-4 shadow-none space-y-4 transition-colors"
          style={getCardStyle()}
        >
          <div>
            <h2
              className="text-sm font-semibold tracking-tight"
              style={{ color: isDarkMode ? '#FFFFFF' : '#0F172A' }}
            >
              Academic Profile
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Personal names and official departmental affiliation.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Form.Item
              name="firstName"
              label={<span className="text-xs font-semibold" style={{ color: isDarkMode ? '#CBD5E1' : '#334155' }}>First Name</span>}
              rules={[{ required: true, message: 'Please enter first name' }]}
              className="mb-0"
            >
              <Input placeholder="First name" className="rounded-md text-xs h-9" style={getInputStyle()} />
            </Form.Item>

            <Form.Item
              name="middleName"
              label={<span className="text-xs font-semibold" style={{ color: isDarkMode ? '#CBD5E1' : '#334155' }}>Middle Name (optional)</span>}
              className="mb-0"
            >
              <Input placeholder="Middle name" className="rounded-md text-xs h-9" style={getInputStyle()} />
            </Form.Item>

            <Form.Item
              name="lastName"
              label={<span className="text-xs font-semibold" style={{ color: isDarkMode ? '#CBD5E1' : '#334155' }}>Last Name</span>}
              rules={[{ required: true, message: 'Please enter last name' }]}
              className="mb-0"
            >
              <Input placeholder="Last name" className="rounded-md text-xs h-9" style={getInputStyle()} />
            </Form.Item>
          </div>

          <div
            className="pt-3 border-t grid grid-cols-1 sm:grid-cols-2 gap-3"
            style={{ borderColor: isDarkMode ? '#1E293B' : '#E2E8F0' }}
          >
            <Form.Item
              name="email"
              label={<span className="text-xs font-medium text-slate-500 dark:text-slate-400">Institutional Email (Read-only)</span>}
              className="mb-0"
            >
              <Input disabled className="rounded-md text-xs h-9 cursor-not-allowed select-none" style={getSubtleStyle()} />
            </Form.Item>

            <Form.Item
              name="department"
              label={<span className="text-xs font-medium text-slate-500 dark:text-slate-400">Department (Read-only)</span>}
              className="mb-0"
            >
              <Input disabled className="rounded-md text-xs h-9 cursor-not-allowed select-none" style={getSubtleStyle()} />
            </Form.Item>
          </div>
        </div>

        {/* Card 2: Security & Password */}
        <div
          className="rounded-lg border p-4 shadow-none space-y-4 transition-colors"
          style={getCardStyle()}
        >
          <div>
            <h2
              className="text-sm font-semibold tracking-tight"
              style={{ color: isDarkMode ? '#FFFFFF' : '#0F172A' }}
            >
              Change Password
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Leave blank if you do not wish to alter your account password.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Form.Item
              name="password"
              label={<span className="text-xs font-semibold" style={{ color: isDarkMode ? '#CBD5E1' : '#334155' }}>New Password</span>}
              className="mb-0"
            >
              <Input.Password placeholder="Leave blank to keep current" className="rounded-md text-xs h-9" style={getInputStyle()} />
            </Form.Item>

            <Form.Item
              name="confirmPassword"
              label={<span className="text-xs font-semibold" style={{ color: isDarkMode ? '#CBD5E1' : '#334155' }}>Confirm Password</span>}
              dependencies={['password']}
              rules={[
                ({ getFieldValue }) => ({
                  validator(_, value) {
                    if (!value || getFieldValue('password') === value) {
                      return Promise.resolve();
                    }
                    return Promise.reject(new Error('Passwords do not match'));
                  },
                }),
              ]}
              className="mb-0"
            >
              <Input.Password placeholder="Confirm new password" className="rounded-md text-xs h-9" style={getInputStyle()} />
            </Form.Item>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-2.5 pt-2">
          <button
            type="button"
            onClick={() => navigate('/lecturer/overview')}
            disabled={loading}
            className="h-9 px-3.5 rounded-md border text-xs font-medium cursor-pointer transition-colors"
            style={getSubtleStyle()}
          >
            Cancel
          </button>

          <button
            type="submit"
            disabled={loading}
            className="h-9 px-4 rounded-md font-semibold text-xs cursor-pointer transition-colors disabled:opacity-50"
            style={{
              backgroundColor: isDarkMode ? '#D4FF5E' : '#131926',
              color: isDarkMode ? '#131926' : '#FFFFFF',
            }}
          >
            {loading ? 'Saving...' : 'Save changes'}
          </button>
        </div>
      </Form>
    </div>
  );
};

export default LecturerSettings;
