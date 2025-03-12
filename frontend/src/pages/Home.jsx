import { Layout, Button, Typography, Row, Col, Card, Space, Carousel, Spin, Collapse, Input, Divider, Form, notification, FloatButton } from 'antd';
import { useNavigate } from 'react-router-dom';
import { QrcodeOutlined, ClockCircleOutlined, SafetyOutlined, MessageOutlined, ArrowRightOutlined, TeamOutlined, LineChartOutlined, FormOutlined, EyeOutlined, CalendarOutlined, DownloadOutlined, DownOutlined, UpOutlined, XOutlined, FacebookOutlined, LinkedinOutlined, InstagramOutlined, GithubOutlined, SendOutlined, ArrowUpOutlined } from '@ant-design/icons';
import { animated, useSpring } from '@react-spring/web';
import { useState, useEffect, useContext, useRef } from 'react';
import PropTypes from 'prop-types'; // Add PropTypes import
import { ThemeContext } from "../context/ThemeContext";
import ThemeToggle from '../components/ThemeToggle';
import logoImage from '../assets/logo.jpg';

const { Header, Content, Footer } = Layout;
const { Title, Text } = Typography;

// Add a styled logo component
const StyledLogo = ({ size = 'normal', onClick = null }) => {
  const sizes = {
    small: { width: 32, height: 32 },
    normal: { width: 40, height: 40 },
    large: { width: 50, height: 50 }
  };

  const { width, height } = sizes[size] || sizes.normal;

  return (
    <div
      className="styled-logo"
      onClick={onClick}
      style={{ cursor: onClick ? 'pointer' : 'default' }}
    >
      <img
        src={logoImage}
        alt="QRollCall Logo"
        className={`logo-image ${size}`}
        width={width}
        height={height}
      />
    </div>
  );
};

// Add PropTypes validation
StyledLogo.propTypes = {
  size: PropTypes.oneOf(['small', 'normal', 'large']),
  onClick: PropTypes.func
};

const Home = () => {
  const navigate = useNavigate();
  const { themeColors, isDarkMode } = useContext(ThemeContext);
  const [loading, setLoading] = useState(true);
  const [showMoreFeatures, setShowMoreFeatures] = useState(false);

  // Create refs properly according to React Hooks rules
  const featureIconRef0 = useRef(null);
  const featureIconRef1 = useRef(null);
  const featureIconRef2 = useRef(null);
  const featureIconRef3 = useRef(null);
  const featureIconRef4 = useRef(null);
  const featureIconRef5 = useRef(null);
  const featureIconRef6 = useRef(null);
  const featureIconRef7 = useRef(null);
  const featureIconRef8 = useRef(null);

  const benefitIconRef0 = useRef(null);
  const benefitIconRef1 = useRef(null);
  const benefitIconRef2 = useRef(null);

  // Create arrays of refs for easy access
  const featureIconRefs = [
    featureIconRef0, featureIconRef1, featureIconRef2,
    featureIconRef3, featureIconRef4, featureIconRef5,
    featureIconRef6, featureIconRef7, featureIconRef8
  ];

  const benefitIconRefs = [benefitIconRef0, benefitIconRef1, benefitIconRef2];

  // Animation configurations
  const bezierEasing = 'cubic-bezier(0.175, 0.885, 0.32, 1.275)';

  // Animations
  const qrAnimation = useSpring({
    from: { transform: 'scale(0) rotate(0deg)', opacity: 0 },
    to: { transform: 'scale(1) rotate(360deg)', opacity: 1 },
    config: { tension: 200, friction: 20 },
    reset: true,
    loop: { reverse: true },
  });
  const taglineAnimation = useSpring({
    from: { opacity: 0, transform: 'translateY(30px)' },
    to: { opacity: 1, transform: 'translateY(0)' },
    delay: 1000,
  });
  const featureRevealAnimation = useSpring({
    opacity: showMoreFeatures ? 1 : 0,
    transform: showMoreFeatures ? 'translateY(0)' : 'translateY(20px)',
    config: { tension: 220, friction: 20 },
  });

  useEffect(() => {
    setTimeout(() => setLoading(false), 1000);
  }, []);

  useEffect(() => {
    document.body.style.background = themeColors.background;
  }, [themeColors]);

  // Function to add a shine element to any card
  const addCardEffects = (cardElement) => {
    const shine = document.createElement('div');
    shine.className = 'card-shine';
    cardElement.appendChild(shine);

    // Add 3D perspective to parent
    cardElement.parentElement.style.perspective = '1000px';
  };

  // Apply card effects when component mounts
  useEffect(() => {
    if (!loading) {
      // Using setTimeout to ensure DOM is fully loaded
      setTimeout(() => {
        document.querySelectorAll('.card-animate').forEach(addCardEffects);
      }, 500);
    }
  }, [loading]);

  // Footer form handling
  const [form] = Form.useForm();
  const [subscribeLoading, setSubscribeLoading] = useState(false);

  // Replace simple alert with Ant Design notification
  const handleSubscribe = (formValues) => {
    // First check for empty values (though Form will handle this)
    if (!formValues?.email) {
      notification.error({
        message: 'Subscription Failed',
        description: 'Please provide a valid email address.',
        placement: 'top',
        duration: 4,
      });
      return;
    }

    setSubscribeLoading(true);
    // Simulate API call
    setTimeout(() => {
      setSubscribeLoading(false);
      form.resetFields();
      notification.success({
        message: 'Subscription Successful',
        description: `Thank you for subscribing with ${formValues.email}! You'll receive our updates shortly.`,
        placement: 'top',
        duration: 4,
        style: {
          borderRadius: '8px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
        }
      });
    }, 1000);
  };

  // Enhanced validation function for email
  const validateEmail = (_, value) => {
    if (!value) {
      return Promise.reject('Please enter your email address');
    }

    // Basic format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(value)) {
      return Promise.reject('Please enter a valid email format (example@domain.com)');
    }

    // Check for specific requirements
    const domain = value.split('@')[1];

    // Optional: Check domain validity (just a simple check)
    if (domain && !domain.includes('.')) {
      return Promise.reject('Invalid email domain format');
    }

    // Optional: Could warn about disposable emails but still allow them
    const disposableDomains = ['mailinator.com', 'temporarymail.com', 'throwaway.com'];
    if (domain && disposableDomains.includes(domain)) {
      return Promise.reject('Please use a permanent email address');
    }

    return Promise.resolve();
  };

  // FAQ Items configuration for modern Collapse usage
  const faqItems = [
    {
      key: '1',
      label: <span style={{ color: themeColors.text, fontSize: '16px' }}>How does QRollCall work?</span>,
      children: <Text style={{ color: themeColors.text, fontSize: '14px' }}>Lecturers generate a QR code per session. Students scan it via their dashboard, and attendance logs instantly with real-time updates.</Text>
    },
    {
      key: '2',
      label: <span style={{ color: themeColors.text, fontSize: '16px' }}>How does it prevent proxy attendance?</span>,
      children: <Text style={{ color: themeColors.text, fontSize: '14px' }}>Dynamic QR codes expire quickly, and unique device IDs paired with secure authentication ensure only the right student marks attendance.</Text>
    },
    {
      key: '3',
      label: <span style={{ color: themeColors.text, fontSize: '16px' }}>How does it benefit lecturers?</span>,
      children: <Text style={{ color: themeColors.text, fontSize: '14px' }}>Real-time tracking, flexible session controls, and exportable historical records simplify attendance management.</Text>
    },
    {
      key: '4',
      label: <span style={{ color: themeColors.text, fontSize: '16px' }}>What&apos;s in it for administrators?</span>,
      children: <Text style={{ color: themeColors.text, fontSize: '14px' }}>A centralized dashboard offers oversight of students, courses, and attendance, with analytics to optimize institutional performance.</Text>
    }
  ];

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: '100vh', background: themeColors.background }}>
        <Spin size="large" style={{ color: themeColors.primary }} />
        <Text style={{ marginTop: 16, color: themeColors.text, fontSize: 18 }}>Loading QRollCall...</Text>
      </div>
    );
  }

  const featureCardStyle = {
    borderRadius: '12px',
    border: 'none',
    padding: '24px',
    height: '260px', // Fixed height for uniformity
    width: '100%',
    transition: 'transform 0.3s ease, box-shadow 0.3s ease, background 0.5s ease',
    background: isDarkMode ? 'rgba(0, 0, 0, 0.2)' : 'rgba(255, 255, 255, 0.1)', // Dark mode fallback
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
    overflow: 'hidden',
    position: 'relative',
  };

  const features = [
    { icon: <ClockCircleOutlined />, title: 'Instant Precision', text: 'Attendance updates in real-time with pinpoint accuracy for every session.', gradient: themeColors.cardGradient1 },
    { icon: <SafetyOutlined />, title: 'Fraud-Proof', text: 'Dynamic QR codes, unique device tracking, and secure authentication stop proxy attendance in its tracks.', gradient: themeColors.cardGradient2 },
    { icon: <MessageOutlined />, title: 'Engage Students', text: 'Interactive feedback and dashboards spark student participation and insights.', gradient: themeColors.cardGradient3 },
    { icon: <TeamOutlined />, title: 'Comprehensive Oversight', text: 'Monitor students, courses, and attendance effortlessly in one powerful dashboard.', gradient: themeColors.cardGradient4 },
    { icon: <LineChartOutlined />, title: 'Data-Driven Insights', text: 'Unlock actionable analytics to boost attendance and performance.', gradient: themeColors.cardGradient5 || themeColors.cardGradient1 },
    { icon: <FormOutlined />, title: 'Streamlined Management', text: 'Simplify attendance and session tracking with an intuitive interface.', gradient: themeColors.cardGradient6 || themeColors.cardGradient2 },
    { icon: <EyeOutlined />, title: 'Real-Time Monitoring', text: 'Track attendance as it happens with live updates.', gradient: themeColors.cardGradient7 || themeColors.cardGradient3 },
    { icon: <CalendarOutlined />, title: 'Flexible Session Control', text: 'Start, end, and manage sessions with ease and precision.', gradient: themeColors.cardGradient8 || themeColors.cardGradient4 },
    { icon: <DownloadOutlined />, title: 'Historical Tracking', text: 'Review and export past attendance for complete records.', gradient: themeColors.cardGradient9 || themeColors.cardGradient1 },
  ];

  return (
    <Layout style={{ minHeight: '100vh', background: themeColors.background, margin: 0, padding: 0, overflowX: 'hidden' }}>
      {/* Header */}
      <Header style={{
        background: themeColors.cardBg,
        padding: '0 16px',
        position: 'fixed',
        top: 0,
        width: '100%',
        zIndex: 10,
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
        lineHeight: '64px',
        height: '64px'
      }}>
        <Row justify="space-between" align="middle" style={{ height: '100%' }}>
          <Col xs={14} sm={12} md={6}>
            <Space align="center" style={{ height: '100%' }}>
              {/* Replace the img tag with the styled logo component */}
              <StyledLogo onClick={() => navigate('/')} />
              <Title level={3} className="site-title" style={{ color: themeColors.text, margin: 0, fontSize: '24px', lineHeight: 'inherit' }}>QRollCall</Title>
            </Space>
          </Col>
          <Col xs={10} sm={12} md={6} style={{ textAlign: 'right' }}>
            <Space size="small" align="center" style={{ height: '100%', lineHeight: 'inherit' }}>
              <Button
                ghost
                className="ant-btn-signup"
                onClick={() => navigate('/auth/login')}
                style={{
                  borderColor: themeColors.primary,
                  borderRadius: '8px',
                  lineHeight: 'inherit',
                  background: themeColors.cardBg,
                  transition: 'background-color 0.3s ease, color 0.3s ease',
                  ...(isDarkMode ? { color: '#fff' } : { color: themeColors.text })
                }}
              >
                <span className="btn-text">Sign Up</span>
              </Button>
              <ThemeToggle />
            </Space>
          </Col>
        </Row>
      </Header>

      <Content style={{ padding: 0, background: themeColors.background }}>
        {/* Hero Section */}
        <section className="hero-section" style={{
          padding: '30px 16px 30px',
          marginTop: '64px', // Base margin to account for fixed header
          background: `linear-gradient(135deg, ${themeColors.cardGradient1} 0%, ${themeColors.cardGradient2} 100%)`,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '80vh',
          width: '100%',
          boxSizing: 'border-box',
        }}>
          <Title level={1} style={{ marginBottom: '20px', color: themeColors.text, fontSize: 'clamp(32px, 6vw, 48px)', textShadow: '0 2px 8px rgba(0,0,0,0.2)' }}>
            Attendance, Redefined
          </Title>
          <animated.div style={taglineAnimation}>
            <Text style={{ fontSize: 'clamp(18px, 3vw, 22px)', color: themeColors.text, display: 'block', marginBottom: '20px', opacity: 0.9, maxWidth: '600px', lineHeight: 1.5, textAlign: 'center' }}>
              Scan. Track. Engage. A smarter way to manage attendance for students, lecturers, and admins.
            </Text>
          </animated.div>
          <animated.div style={{ ...qrAnimation, marginBottom: '20px' }}>
            <QrcodeOutlined style={{ fontSize: 'clamp(120px, 20vw, 200px)', color: themeColors.text }} />
          </animated.div>
          <Space size="large" wrap>
            <Button type="primary" size="large" onClick={() => navigate('/auth/login')} style={{ padding: '0 40px', height: '50px', background: themeColors.primary, borderColor: themeColors.primary, borderRadius: '8px', fontSize: '16px' }}>
              Get Started <ArrowRightOutlined />
            </Button>
            <Button
              className="explore-btn"
              size="large"
              onClick={() => document.getElementById('features').scrollIntoView({ behavior: 'smooth' })}
              style={{
                padding: '0 40px',
                height: '50px',
                color: themeColors.text,
                borderColor: themeColors.secondary,
                background: 'transparent',
                borderRadius: '8px',
                fontSize: '16px',
                transition: 'background-color 0.3s ease, color 0.3s ease'
              }}
            >
              Explore Features
            </Button>
          </Space>
        </section>

        {/* Features Grid */}
        <section id="features" style={{ padding: '60px 16px', background: themeColors.background, width: '100%', boxSizing: 'border-box' }}>
          <Title level={2} style={{ marginBottom: '48px', color: themeColors.text, fontSize: 'clamp(28px, 5vw, 36px)', textAlign: 'center' }}>
            Why QRollCall?
          </Title>
          <Row gutter={[16, 16]} justify="center" className="staggered-row">
            {features.slice(0, 3).map((feature, i) => (
              <Col xs={24} sm={12} md={8} key={i} className="card-container">
                <Card
                  hoverable
                  className="feature-card card-animate"
                  style={{ ...featureCardStyle, background: feature.gradient }}
                  onMouseEnter={() => {
                    if (featureIconRefs[i]?.current) {
                      featureIconRefs[i].current.style.transform = 'scale(1.2) translateY(-5px)';
                    }
                  }}
                  onMouseLeave={() => {
                    if (featureIconRefs[i]?.current) {
                      featureIconRefs[i].current.style.transform = 'scale(1) translateY(0)';
                    }
                  }}
                >
                  <div className="card-icon-wrapper">
                    <div
                      ref={featureIconRefs[i]}
                      style={{
                        transition: `transform 0.3s ${bezierEasing}`,
                        fontSize: '40px',
                        color: '#fff',
                        display: 'inline-block'
                      }}
                    >
                      {feature.icon}
                    </div>
                  </div>
                  <Title level={4} style={{ margin: '16px 0', color: '#fff', fontSize: '20px' }}>{feature.title}</Title>
                  <Text style={{ color: '#fff', fontSize: '16px', flexGrow: 1 }}>{feature.text}</Text>
                  <div className="card-shine"></div>
                </Card>
              </Col>
            ))}
          </Row>
          <animated.div style={featureRevealAnimation}>
            {showMoreFeatures && (
              <Row gutter={[16, 16]} justify="center" className="staggered-row">
                {features.slice(3).map((feature, index) => (
                  <Col xs={24} sm={12} md={8} key={index} className="card-container">
                    <Card
                      hoverable
                      className="feature-card card-animate"
                      style={{ ...featureCardStyle, background: feature.gradient }}
                      onMouseEnter={() => {
                        if (featureIconRefs[index + 3]?.current) {
                          featureIconRefs[index + 3].current.style.transform = 'scale(1.2) translateY(-5px)';
                        }
                      }}
                      onMouseLeave={() => {
                        if (featureIconRefs[index + 3]?.current) {
                          featureIconRefs[index + 3].current.style.transform = 'scale(1) translateY(0)';
                        }
                      }}
                    >
                      <div className="card-icon-wrapper">
                        <div
                          ref={featureIconRefs[index + 3]}
                          style={{
                            transition: `transform 0.3s ${bezierEasing}`,
                            fontSize: '40px',
                            color: '#fff',
                            display: 'inline-block'
                          }}
                        >
                          {feature.icon}
                        </div>
                      </div>
                      <Title level={4} style={{ margin: '16px 0', color: '#fff', fontSize: '20px' }}>{feature.title}</Title>
                      <Text style={{ color: '#fff', fontSize: '16px', flexGrow: 1 }}>{feature.text}</Text>
                      <div className="card-shine"></div>
                    </Card>
                  </Col>
                ))}
              </Row>
            )}
          </animated.div>
          <div style={{ textAlign: 'center', marginTop: '24px' }}>
            <Button
              type="primary"
              shape="circle"
              icon={showMoreFeatures ? <UpOutlined /> : <DownOutlined />}
              onClick={() => setShowMoreFeatures(!showMoreFeatures)}
              style={{ background: themeColors.primary, borderColor: themeColors.primary, width: '50px', height: '50px' }}
            />
          </div>
        </section>

        {/* Benefits Section */}
        <section id="benefits" style={{ padding: '60px 16px', background: themeColors.cardBg, width: '100%', boxSizing: 'border-box' }}>
          <Title level={2} style={{ marginBottom: '40px', color: themeColors.text, fontSize: 'clamp(28px, 5vw, 36px)', textAlign: 'center' }}>
            Benefits for Everyone
          </Title>
          <Row gutter={[24, 24]} justify="center" className="staggered-row">
            <Col xs={24} sm={12} md={8} className="card-container">
              <Card
                hoverable
                className="feature-card card-animate"
                style={{ ...featureCardStyle, background: themeColors.cardGradient1 }}
                onMouseEnter={() => {
                  if (benefitIconRefs[0]?.current) {
                    benefitIconRefs[0].current.style.transform = 'scale(1.2) translateY(-5px)';
                  }
                }}
                onMouseLeave={() => {
                  if (benefitIconRefs[0]?.current) {
                    benefitIconRefs[0].current.style.transform = 'scale(1) translateY(0)';
                  }
                }}
              >
                <div className="card-icon-wrapper">
                  <div
                    ref={benefitIconRefs[0]}
                    style={{
                      transition: `transform 0.3s ${bezierEasing}`,
                      fontSize: '40px',
                      color: '#fff',
                      display: 'inline-block'
                    }}
                  >
                    <TeamOutlined />
                  </div>
                </div>
                <Title level={4} style={{ margin: '16px 0', color: '#fff', fontSize: '20px' }}>For Students</Title>
                <Text style={{ color: '#fff', fontSize: '16px' }}>
                  Quick scans, interactive feedback, and clear attendance insights keep you engaged.
                </Text>
                <div className="card-shine"></div>
              </Card>
            </Col>
            <Col xs={24} sm={12} md={8} className="card-container">
              <Card
                hoverable
                className="feature-card card-animate"
                style={{ ...featureCardStyle, background: themeColors.cardGradient2 }}
                onMouseEnter={() => {
                  if (benefitIconRefs[1]?.current) {
                    benefitIconRefs[1].current.style.transform = 'scale(1.2) translateY(-5px)';
                  }
                }}
                onMouseLeave={() => {
                  if (benefitIconRefs[1]?.current) {
                    benefitIconRefs[1].current.style.transform = 'scale(1) translateY(0)';
                  }
                }}
              >
                <div className="card-icon-wrapper">
                  <div
                    ref={benefitIconRefs[1]}
                    style={{
                      transition: `transform 0.3s ${bezierEasing}`,
                      fontSize: '40px',
                      color: '#fff',
                      display: 'inline-block'
                    }}
                  >
                    <FormOutlined />
                  </div>
                </div>
                <Title level={4} style={{ margin: '16px 0', color: '#fff', fontSize: '20px' }}>For Lecturers</Title>
                <Text style={{ color: '#fff', fontSize: '16px' }}>
                  Effortless session management, real-time tracking, and historical records at your fingertips.
                </Text>
                <div className="card-shine"></div>
              </Card>
            </Col>
            <Col xs={24} sm={12} md={8} className="card-container">
              <Card
                hoverable
                className="feature-card card-animate"
                style={{ ...featureCardStyle, background: themeColors.cardGradient3 }}
                onMouseEnter={() => {
                  if (benefitIconRefs[2]?.current) {
                    benefitIconRefs[2].current.style.transform = 'scale(1.2) translateY(-5px)';
                  }
                }}
                onMouseLeave={() => {
                  if (benefitIconRefs[2]?.current) {
                    benefitIconRefs[2].current.style.transform = 'scale(1) translateY(0)';
                  }
                }}
              >
                <div className="card-icon-wrapper">
                  <div
                    ref={benefitIconRefs[2]}
                    style={{
                      transition: `transform 0.3s ${bezierEasing}`,
                      fontSize: '40px',
                      color: '#fff',
                      display: 'inline-block'
                    }}
                  >
                    <LineChartOutlined />
                  </div>
                </div>
                <Title level={4} style={{ margin: '16px 0', color: '#fff', fontSize: '20px' }}>For Admins</Title>
                <Text style={{ color: '#fff', fontSize: '16px' }}>
                  Centralized oversight, detailed analytics, and fraud prevention streamline operations.
                </Text>
                <div className="card-shine"></div>
              </Card>
            </Col>
          </Row>
        </section>

        {/* Video Demo Section */}
        <section style={{ padding: '60px 16px', background: themeColors.background, width: '100%', boxSizing: 'border-box' }}>
          <Title level={2} style={{ marginBottom: '40px', color: themeColors.text, fontSize: 'clamp(28px, 5vw, 36px)', textAlign: 'center' }}>
            See It in Action
          </Title>
          <Row justify="center">
            <Col xs={24} md={16}>
              <div style={{
                position: 'relative',
                paddingBottom: '56.25%',
                height: 0,
                overflow: 'hidden',
                borderRadius: '12px',
                border: `1px solid ${themeColors.border}`,
                maxWidth: '100%',
                boxShadow: '0 4px 16px rgba(0, 0, 0, 0.15)',
              }}>
                <iframe
                  style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', border: 'none' }}
                  src="https://www.youtube.com/embed/dQw4w9WgXcQ?si=your-placeholder-id"
                  title="QRollCall Demo"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                ></iframe>
              </div>
              <Text style={{ display: 'block', marginTop: '16px', color: themeColors.text, fontSize: '16px', opacity: 0.85, textAlign: 'center' }}>
                Watch how QRollCall transforms attendance in 90 seconds!
              </Text>
            </Col>
          </Row>
        </section>

        {/* Testimonials - Fixed block attribute warning */}
        <section id="testimonials" style={{ padding: '60px 16px', background: themeColors.cardBg, width: '100%', boxSizing: 'border-box' }}>
          <Title level={2} style={{ marginBottom: '40px', color: themeColors.text, fontSize: 'clamp(28px, 5vw, 36px)', textAlign: 'center' }}>
            What Educators Say
          </Title>
          <Carousel autoplay dots={{ className: 'custom-dots' }} style={{ maxWidth: '800px', margin: '0 auto' }}>
            <div>
              <Card style={{ ...featureCardStyle, background: themeColors.cardGradient1 }} className="testimonial-card card-animate">
                <div className="testimonial-content">
                  <Text className="testimonial-quote" style={{ color: '#fff', fontSize: 'clamp(18px, 3vw, 24px)', lineHeight: '1.5', textAlign: 'center', padding: '0 10px', fontStyle: 'italic' }}>&quot;QRollCall halved our attendance time.&quot;</Text>
                  {/* Fixed: Removed block prop and used div with styling instead */}
                  <div style={{ marginTop: '24px', textAlign: 'center' }}>
                    <Text strong className="testimonial-author" style={{ color: '#fff', fontSize: 'clamp(14px, 2vw, 18px)' }}>- Dr. Maya Patel, Horizon University</Text>
                  </div>
                </div>
              </Card>
            </div>
            <div>
              <Card style={{ ...featureCardStyle, background: themeColors.cardGradient2 }} className="testimonial-card card-animate">
                <div className="testimonial-content">
                  <Text className="testimonial-quote" style={{ color: '#fff', fontSize: 'clamp(18px, 3vw, 24px)', lineHeight: '1.5', textAlign: 'center', padding: '0 10px', fontStyle: 'italic' }}>&quot;Device tracking ended proxy attendance.&quot;</Text>
                  {/* Fixed: Removed block prop and used div with styling instead */}
                  <div style={{ marginTop: '24px', textAlign: 'center' }}>
                    <Text strong className="testimonial-author" style={{ color: '#fff', fontSize: 'clamp(14px, 2vw, 18px)' }}>- Prof. Liam Carter, Summit College</Text>
                  </div>
                </div>
              </Card>
            </div>
            <div>
              <Card style={{ ...featureCardStyle, background: themeColors.cardGradient3 }} className="testimonial-card card-animate">
                <div className="testimonial-content">
                  <Text className="testimonial-quote" style={{ color: '#fff', fontSize: 'clamp(18px, 3vw, 24px)', lineHeight: '1.5', textAlign: 'center', padding: '0 10px', fontStyle: 'italic' }}>&quot;Feedback feature sparked real dialogue.&quot;</Text>
                  {/* Fixed: Removed block prop and used div with styling instead */}
                  <div style={{ marginTop: '24px', textAlign: 'center' }}>
                    <Text strong className="testimonial-author" style={{ color: '#fff', fontSize: 'clamp(14px, 2vw, 18px)' }}>- Ms. Elena Ortiz, Bright Academy</Text>
                  </div>
                </div>
              </Card>
            </div>
          </Carousel>
        </section>

        {/* FAQ Section - Using items prop instead of children */}
        <section style={{ padding: '60px 16px', background: themeColors.background, width: '100%', boxSizing: 'border-box' }}>
          <Title level={2} style={{ marginBottom: '40px', color: themeColors.text, fontSize: 'clamp(28px, 5vw, 36px)', textAlign: 'center' }}>
            Frequently Asked Questions
          </Title>
          <div style={{ maxWidth: '800px', margin: '0 auto' }}>
            <Collapse
              accordion
              bordered={false}
              style={{ background: themeColors.cardBg, borderRadius: '12px', border: `1px solid ${themeColors.border}` }}
              items={faqItems}
            />
          </div>
        </section>

        {/* Roadmap */}
        <section style={{ padding: '60px 16px', background: themeColors.cardBg, width: '100%', boxSizing: 'border-box' }}>
          <Title level={2} style={{ marginBottom: '48px', color: themeColors.text, fontSize: 'clamp(28px, 5vw, 36px)', textAlign: 'center' }}>
            What’s Next for QRollCall
          </Title>
          <Row gutter={[16, 16]} justify="center" className="staggered-row">
            <Col xs={24} sm={12} md={8} className="card-container">
              <Card hoverable style={{ ...featureCardStyle, background: themeColors.cardGradient1 }} className="feature-card card-animate">
                <Title level={4} style={{ color: '#fff', fontSize: '20px' }}>Q1 2026</Title>
                <Text style={{ color: '#fff', fontSize: '16px' }}>Rich engagement dashboards for deeper student insights.</Text>
                <div className="card-shine"></div>
              </Card>
            </Col>
            <Col xs={24} sm={12} md={8} className="card-container">
              <Card hoverable style={{ ...featureCardStyle, background: themeColors.cardGradient2 }} className="feature-card card-animate">
                <Title level={4} style={{ color: '#fff', fontSize: '20px' }}>Q2 2026</Title>
                <Text style={{ color: '#fff', fontSize: '16px' }}>Facial recognition to enhance attendance security.</Text>
                <div className="card-shine"></div>
              </Card>
            </Col>
            <Col xs={24} sm={12} md={8} className="card-container">
              <Card hoverable style={{ ...featureCardStyle, background: themeColors.cardGradient3 }} className="feature-card card-animate">
                <Title level={4} style={{ color: '#fff', fontSize: '20px' }}>Q3 2026</Title>
                <Text style={{ color: '#fff', fontSize: '16px' }}>Global language support for worldwide accessibility.</Text>
                <div className="card-shine"></div>
              </Card>
            </Col>
          </Row>
        </section>

        {/* CTA Section */}
        <section style={{
          padding: '80px 16px',
          background: `linear-gradient(135deg, ${themeColors.cardGradient3} 0%, ${themeColors.cardGradient1} 100%)`,
          textAlign: 'center',
          width: '100%',
          boxSizing: 'border-box',
        }}>
          <Title level={2} style={{ marginBottom: '24px', color: themeColors.text, fontSize: 'clamp(28px, 5vw, 36px)', textShadow: '0 2px 8px rgba(0,0,0,0.2)' }}>
            Ready to Transform Attendance?
          </Title>
          <Text style={{ fontSize: 'clamp(16px, 2.5vw, 18px)', marginBottom: '40px', display: 'block', color: themeColors.text, opacity: 0.9, maxWidth: '600px', margin: '0 auto 40px', textAlign: 'center' }}>
            Join institutions worldwide in simplifying attendance with QRollCall’s innovative tools.
          </Text>
          <Button type="primary" size="large" onClick={() => navigate('/auth/login')} style={{ padding: '0 50px', height: '60px', fontSize: '18px', background: themeColors.primary, borderColor: themeColors.primary, borderRadius: '8px' }}>
            Get Started Free
          </Button>
        </section>
      </Content>

      {/* Footer - Updated for better dark mode visibility */}
      <Footer className="modern-footer">
        <div className="footer-top">
          <Row gutter={[30, 30]} justify="space-between">
            <Col xs={24} sm={24} md={7}>
              <div className="footer-brand">
                <div className="footer-logo">
                  <StyledLogo size="large" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} />
                  <Title level={4} className="brand-name">QRollCall</Title>
                </div>
                <Text style={{ color: isDarkMode ? '#e0e0e0' : themeColors.text, opacity: 0.85 }}>
                  Revolutionizing attendance tracking for educational institutions with smart, secure QR code technology.
                </Text>
                <div className="social-icons">
                  <a href="https://twitter.com/" target="_blank" rel="noopener noreferrer"><XOutlined /></a>
                  <a href="https://facebook.com/" target="_blank" rel="noopener noreferrer"><FacebookOutlined /></a>
                  <a href="https://linkedin.com/" target="_blank" rel="noopener noreferrer"><LinkedinOutlined /></a>
                  <a href="https://instagram.com/" target="_blank" rel="noopener noreferrer"><InstagramOutlined /></a>
                  <a href="https://github.com/" target="_blank" rel="noopener noreferrer"><GithubOutlined /></a>
                </div>
              </div>
            </Col>

            {/* Adjusted columns to be side by side on small screens */}
            <Col xs={12} sm={12} md={5}>
              <Title level={4} className="footer-heading">Quick Links</Title>
              <ul className="footer-links">
                <li><a href="#features">Features</a></li>
                <li><a href="#benefits">For Schools</a></li>
                <li><a href="#testimonials">Testimonials</a></li>
                <li><a href="#faq">FAQ</a></li>
                <li><a href="/contact">Support</a></li>
              </ul>
            </Col>

            <Col xs={12} sm={12} md={5}>
              <Title level={4} className="footer-heading">Resources</Title>
              <ul className="footer-links">
                <li><a href="/blog">Blog</a></li>
                <li><a href="/docs">Documentation</a></li>
                <li><a href="/tutorials">Tutorials</a></li>
                <li><a href="/api">API Reference</a></li>
                <li><a href="/privacy">Privacy Policy</a></li>
              </ul>
            </Col>

            <Col xs={24} md={7}>
              <Title level={4} className="footer-heading">Stay Updated</Title>
              <Text style={{ color: isDarkMode ? '#e0e0e0' : themeColors.text, opacity: 0.85, marginBottom: '16px', display: 'block' }}>
                Subscribe to our newsletter for the latest updates and features.
              </Text>
              <Form form={form} onFinish={handleSubscribe} className="newsletter-form">
                <Form.Item
                  name="email"
                  validateTrigger={['onChange', 'onBlur']}
                  rules={[
                    {
                      required: true,
                      message: 'Email is required'
                    },
                    {
                      type: 'email',
                      message: 'Please enter a valid email address'
                    },
                    {
                      validator: validateEmail
                    }
                  ]}
                  validateFirst={true}
                >
                  <Input
                    placeholder="Your email address"
                    style={{ color: isDarkMode ? '#fff' : themeColors.text }}
                    status={form.getFieldError('email').length > 0 ? 'error' : ''}
                    suffix={
                      <Button
                        type="text"
                        htmlType="submit"
                        className="subscribe-btn"
                        loading={subscribeLoading}
                        icon={<SendOutlined />}
                      />
                    }
                  />
                </Form.Item>
              </Form>
              <div className="contact-info">
                <p style={{ color: isDarkMode ? '#e0e0e0' : themeColors.text, opacity: 0.85, marginBottom: '8px' }}>
                  <strong>Email:</strong> hello@qrollcall.com
                </p>
                <p style={{ color: isDarkMode ? '#e0e0e0' : themeColors.text, opacity: 0.85 }}>
                  <strong>Phone:</strong> +1 (555) 123-4567
                </p>
              </div>
            </Col>
          </Row>
        </div>

        <Divider className="footer-divider" />

        <div className="footer-bottom">
          <div className="copyright">
            <Text style={{ color: isDarkMode ? '#e0e0e0' : themeColors.text, opacity: 0.7, fontSize: '14px' }}>
              © {new Date().getFullYear()} QRollCall. All rights reserved.
            </Text>
          </div>
          <div className="footer-bottom-links">
            <a className="footer-link" href="/terms">Terms</a>
            <a className="footer-link" href="/privacy">Privacy</a>
            <a className="footer-link" href="/cookies">Cookies</a>
          </div>
        </div>
      </Footer>

      {/* Back to Top Button - Now using ArrowUpOutlined */}
      <FloatButton.BackTop
        icon={<ArrowUpOutlined />}
        style={{ backgroundColor: themeColors.primary }}
        type="primary"
        visibilityHeight={300}
      />

      <style>{`
        html, body {
          margin: 0;
          padding: 0;
          overflow-x: 'hidden';
        }

        /* Remove any default margins/paddings from Layout components */
        .ant-layout {
          margin: 0 !important;
          padding: 0 !important;
        }

        .ant-layout-content {
          margin: 0 !important;
        }
        
        .ant-btn-ghost:hover {
          background: ${themeColors.primary} !important;
          border-color: ${themeColors.secondary} !important;
          color: #fff !important;
        }
        .ant-btn-primary:hover, .ant-btn-primary:focus {
          background: ${themeColors.focus} !important;
          border-color: ${themeColors.focus} !important;
          color: ${themeColors.text} !important;
        }
        .ant-carousel .custom-dots li button {
          background: ${themeColors.text}80 !important;
          width: 10px !important;
          height: 10px !important;
          border-radius: 50% !important;
        }
        .ant-carousel .custom-dots li.slick-active button {
          background: ${themeColors.primary} !important;
          width: 12px !important;
          height: 12px !important;
        }
        .ant-card.hoverable:hover {
          transform: translateY(-6px);
          boxShadow: 0 8px 20px rgba(0, 0, 0, 0.15);
        }
        @media (max-width: 767px) {
          .ant-col {
            padding: 0 8px !important;
          }
          .ant-space {
            flex-wrap: wrap !important;
          }
          /* Reduce top margin/padding on medium screens */
          section:first-of-type {
            margin-top: 64px !important; 
            padding-top: 16px !important;
          }
        }
        
        @media (max-width: 576px) {
        .ant-layout {
          margin: 0 !important;
          padding: 0 !important;
        }

        .ant-layout-content {
          margin: 0 !important;
        }
          .ant-typography h1 {
            font-size: 32px !important;
          }
          .ant-typography h2 {
            font-size: 28px !important;
          }
          .ant-btn {
            padding: 0 15px !important;
            height: 36px !important;
            font-size: 14px !important;
          }
          section {
            padding: 30px 0px !important;
          }
          /* Minimum spacing on small screens */
          section:first-of-type {
            margin-top: 6px !important;
            padding-top: 8px !important;
          }
        }

        /* Header responsive styling */
        .site-title {
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        
        /* Make space for all header elements */
        @media (max-width: 576px) {
          /* Smaller screens */
          .ant-layout-header {
            padding: 0 8px !important;
          }
          
          .site-title {
            font-size: 18px !important;
          }
          
          .btn-text {
            font-size: 12px;
            padding: 0 4px;
          }
          
          .ant-space {
            gap: 4px !important;
          }
          
          .ant-btn {
            min-width: 0;
            padding: 0 8px !important;
          }
          
           .hero-section {
          transition: padding 0.3s ease, margin 0.3s ease;
          margin-bottom: 2px !important;
          padding-bottom: 2px !important;
        }

        }
        
        @media (max-width: 350px) {
          /* Very small screens */
          .site-title {
            max-width: 80px;
            font-size: 16px !important;
          }
        }
        
        /* Hero section adjustments */
        .hero-section {
          transition: padding 0.3s ease, margin 0.3s ease;
          margin-bottom: 2px;
        }
        
        @media (max-width: 767px) {
          /* Reduce spacing on medium screens */
          .hero-section {
            padding-bottom: 16px !important;
            margin-bottom: 0 !important;
            min-height: 70vh !important;
          }
        }
        
        @media (max-width: 576px) {
          /* Minimal spacing on small screens */
          .hero-section {
            padding-bottom: 8px !important;
            margin-bottom: 0 !important;
            min-height: 60vh !important; /* Reduce height on very small screens */
          }
        }

        /* Custom button hover states */
        .ant-btn-signup:hover {
          background: ${themeColors.primary} !important;
          border-color: ${themeColors.primary} !important;
          color: #fff !important;
        }
        
        .ant-btn-ghost:hover, .ant-btn-signup:hover {
          background: ${themeColors.primary} !important;
          border-color: ${themeColors.primary} !important;
          color: #fff !important;
        }
        
        .explore-btn:hover {
          background: ${themeColors.secondary} !important;
          border-color: ${themeColors.secondary} !important;
          color: #fff !important;
        }
        
        /* Back to top button styles */
        .back-to-top-btn, .ant-float-btn-circle {
          height: 40px;
          width: 40px;
          border-radius: 50%;
          background-color: ${themeColors.primary}!important;
          color: #fff !important;
          display: flex;
          justify-content: center;
          align-items: center;
          box-shadow: 0 3px 6px rgba(0, 0, 0, 0.16);
          transition: all 0.3s ease;
        }
        
        .back-to-top-btn:hover, .ant-float-btn-circle:hover {
          background-color: #A29BFE}!important;
          cursor: pointer;
          color: #fff !important;
          transform: scale(1.1);
        }
        
        /* Override default Ant Design BackTop styles */
        .ant-back-top {
          right: 20px;
          bottom: 20px;
        }

        /* Card effects */
        .feature-card {
          transition: transform 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275), box-shadow 0.4s ease !important;
        }
        
        .feature-card:hover {
          transform: translateY(-10px) scale(1.02) !important;
          box-shadow: 0 15px 30px rgba(0, 0, 0, 0.2) !important;
        }
        
        .card-container {
          perspective: 1000px;
          margin-bottom: 20px;
        }
        
        .card-icon-wrapper {
          position: relative;
          z-index: 2;
        }
        
        /* Shine effect */
        .card-shine {
          position: absolute;
          top: 0;
          left: -100%;
          width: 50%;
          height: 100%;
          background: linear-gradient(
            to right,
            rgba(255, 255, 255, 0) 0%,
            rgba(255, 255, 255, 0.3) 50%,
            rgba(255, 255, 255, 0) 100%
          );
          transform: skewX(-25deg);
          transition: none;
        }
        
        .feature-card:hover .card-shine {
          animation: shine 1.5s infinite;
        }
        
        @keyframes shine {
          0% {
            left: -100%;
            transition-property: left;
          }
          100% {
            left: 200%;
            transition-property: left;
          }
        }
        
        /* Pulse effect for testimonial cards */
        .ant-carousel .slick-slide .ant-card {
          animation: pulse 3s infinite;
        }
        
        @keyframes pulse {
          0% {
            box-shadow: 0 0 0 0 rgba(255, 255, 255, 0.4);
          }
          70% {
            box-shadow: 0 0 0 10px rgba(255, 255, 255, 0);
          }
          100% {
            box-shadow: 0 0 0 0 rgba(255, 255, 255, 0);
          }
        }
        
        /* Staggered animation for feature cards */
        .card-container:nth-child(1) .feature-card {
          animation: fadeInUp 0.5s 0.1s backwards;
        }
        
        .card-container:nth-child(2) .feature-card {
          animation: fadeInUp 0.5s 0.3s backwards;
        }
        
        .card-container:nth-child(3) .feature-card {
          animation: fadeInUp 0.5s 0.5s backwards;
        }
        
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        /* Enhanced card animations */
        .feature-card {
          transition: transform 0.4s ${bezierEasing}, box-shadow 0.4s ease, background 0.5s ease !important;
          will-change: transform, box-shadow;
          transform-origin: center bottom;
        }
        
        .feature-card:hover {
          transform: translateY(-10px) scale(1.02) !important;
          box-shadow: 0 15px 30px rgba(0, 0, 0, 0.2) !important;
        }
        
        /* 3D effect on hover */
        .card-container {
          perspective: 1000px;
          margin-bottom: 20px;
        }
        
        .card-container:hover .feature-card {
          background: linear-gradient(
            to right,
            rgba(255, 255, 255, 0) 0%,
            rgba(255, 255, 255, 0.3) 50%,
            rgba(255, 255, 255, 0) 100%
          );
          transform: skewX(-25deg);
          transition: none;
        }
        
        .feature-card:hover .card-shine {
          animation: shine 1.5s infinite;
        }
        
        @keyframes shine {
          0% {
            left: -100%;
            transition-property: left;
          }
          100% {
            left: 200%;
            transition-property: left;
          }
        }
        
        /* Enhanced testimonial cards */
        .testimonial-card {
          animation: float 6s ease-in-out infinite, pulse 3s infinite !important;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        
        .testimonial-content {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          height: 100%;
          padding: 10px;
        }
        
        .testimonial-quote {
          position: relative;
          font-weight: 500;
          text-shadow: 0 1px 2px rgba(0,0,0,0.1);
        }
        
        .testimonial-quote::before,
        .testimonial-quote::after {
          content: '"';
          font-size: 1.5em;
          font-family: Georgia, serif;
          opacity: 0.7;
          position: relative;
          line-height: 0;
        }
        
        .testimonial-author {
          font-weight: 500;
          letter-spacing: 0.5px;
          opacity: 0.9;
        }
        
        @media (max-width: 576px) {
          .testimonial-quote {
            font-size: 18px !important;
          }
          
          .testimonial-author {
            font-size: 14px !important;
          }
        }
        
        /* Staggered animation for all rows of cards */
        .staggered-row .card-container:nth-child(1) .feature-card {
          animation: fadeInUp 0.6s 0.1s backwards;
        }
        
        .staggered-row .card-container:nth-child(2) .feature-card {
          animation: fadeInUp 0.6s 0.3s backwards;
        }
        
        .staggered-row .card-container:nth-child(3) .feature-card {
          animation: fadeInUp 0.6s 0.5s backwards;
        }
        
        .staggered-row .card-container:nth-child(4) .feature-card {
          animation: fadeInUp 0.6s 0.7s backwards;
        }
        
        .staggered-row .card-container:nth-child(5) .feature-card {
          animation: fadeInUp 0.6s 0.9s backwards;
        }
        
        .staggered-row .card-container:nth-child(6) .feature-card {
          animation: fadeInUp 0.6s 1.1s backwards;
        }
        
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        /* Tilt effect on card hover */
        .card-container .feature-card {
          transition: transform 0.5s ${bezierEasing};
        }
        
        .card-container:hover .feature-card {
          transform: translateY(-10px) rotateX(5deg) rotateY(5deg) scale(1.05) !important;
        }
        
        /* Optimize animations for reduced motion preference */
        @media (prefers-reduced-motion) {
          .feature-card, .card-container .feature-card, .testimonial-card {
            transition: none !important;
            animation: none !important;
          }
          
          .feature-card:hover, .card-container:hover .feature-card {
            transform: none !important;
          }
          
          .card-shine {
            display: none;
          }
        }

        /* Modern Footer Styles */
        .modern-footer {
          background: ${isDarkMode ? '#1f1f1f' : '#f5f8fa'};
          color: ${themeColors.text};
          padding: 60px 40px 30px;
          position: relative;
          border-top: 1px solid ${themeColors.border};
        }

        .footer-top {
          margin-bottom: 20px;
        }

        .footer-brand {
          margin-bottom: 24px;
        }

        .footer-logo {
          display: flex;
          align-items: center;
          margin-bottom: 16px;
        }

        .footer-logo img {
          width: 40px;
          height: 40px;
          margin-right: 12px;
          border-radius: 8px;
        }

        .brand-name {
          color: ${themeColors.primary} !important;
          margin: 0 !important;
        }

        .social-icons {
          display: flex;
          gap: 16px;
          margin-top: 20px;
        }

        .social-icons a {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 36px;
          height: 36px;
          background: ${isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)'};
          border-radius: 50%;
          color: ${themeColors.text};
          font-size: 18px;
          transition: all 0.3s ease;
        }

        .social-icons a:hover {
          background: ${themeColors.primary};
          color: #fff;
          transform: translateY(-3px);
        }

        .footer-heading {
          color: ${themeColors.text} !important;
          margin-bottom: 20px !important;
          position: relative;
          font-size: 18px !important;
        }

        .footer-heading::after {
          content: '';
          position: absolute;
          bottom: -8px;
          left: 0;
          width: 40px;
          height: 3px;
          background: ${themeColors.primary};
          border-radius: 1px;
        }

        .footer-links {
          list-style: none;
          padding: 0;
          margin: 0;
        }

        .footer-links li {
          margin-bottom: 12px;
        }

        .footer-links a {
          color: ${isDarkMode ? '#e0e0e0' : themeColors.text};
          opacity: 0.8;
          transition: all 0.2s ease;
          position: relative;
          padding-left: 0;
        }

        .footer-links a::before {
          content: '›';
          position: absolute;
          left: 0;
          opacity: 0;
          transition: all 0.3s ease;
        }

        .footer-links a:hover {
          color: ${themeColors.primary};
          opacity: 1;
          padding-left: 14px;
        }

        .footer-links a:hover::before {
          opacity: 1;
          left: 0;
        }

        .newsletter-text {
          margin-bottom: 16px;
          display: block;
        }

        .newsletter-form {
          margin-bottom: 20px;
        }

        .newsletter-form .ant-input {
          background: ${isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.8)'};
          border: 1px solid ${themeColors.border};
          border-radius: 8px;
          height: 44px;
          color: ${isDarkMode ? '#fff' : themeColors.text};
        }

        .subscribe-btn {
          color: ${themeColors.primary};
          cursor: pointer;
        }

        .subscribe-btn:hover {
          color: ${themeColors.focus};
        }

        .contact-info p {
          margin-bottom: 8px;
          opacity: 0.8;
        }

        .footer-divider {
          border-color: ${isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.06)'};
          margin: 20px 0;
        }

        .footer-bottom {
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
        }

        .copyright {
          opacity: 0.7;
          font-size: 14px;
        }

        .footer-bottom-links {
          display: flex;
          gap: 24px;
        }

        .footer-bottom-links a {
          color: ${isDarkMode ? '#e0e0e0' : themeColors.text};
          opacity: 0.7;
          font-size: 14px;
          transition: all 0.2s ease;
        }

        .footer-bottom-links a:hover {
          color: ${themeColors.primary};
          opacity: 1;
        }

        @media (max-width: 768px) {
          .modern-footer {
            padding: 40px 16px 20px;
          }

          .footer-bottom {
            flex-direction: column;
            align-items: center;
            gap: 16px;
            text-align: center;
          }

          .footer-bottom-links {
            gap: 16px;
          }

          .footer-logo {
            justify-content: center;
          }

          .social-icons {
            justify-content: center;
          }

          .footer-heading {
            text-align: center;
          }

          .footer-heading::after {
            left: 50%;
            transform: translateX(-50%);
          }

          .footer-links {
            text-align: center;
          }

          .footer-links a::before {
            display: none;
          }

          .footer-links a:hover {
            padding-left: 0;
          }

          .newsletter-text {
            text-align: center;
          }

          .contact-info {
            text-align: center;
          }
        }

        /* Fixed FloatButton styles to always use primary color */
        .ant-float-btn-primary {
          background-color: ${themeColors.primary} !important;
          color: #fff !important;
        }
        
        .ant-float-btn-primary:hover {
          background-color: ${themeColors.focus || themeColors.primary} !important;
        }
        
        /* Override any default FloatButton styling */
        .ant-float-btn {
          right: 24px !important;
          bottom: 24px !important;
        }
        
        .ant-float-btn-body {
          background-color: ${themeColors.primary} !important;
        }

        /* Logo Styling */
        .styled-logo {
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
          transition: transform 0.3s ease;
        }

        .styled-logo:hover {
          transform: scale(1.05);
        }
        
        .logo-image {
          border-radius: 10px;
          object-fit: cover;
          box-shadow: 0 2px 8px rgba(0,0,0,0.15);
          border: 2px solid ${themeColors.primary};
          background-color: ${isDarkMode ? '#2a2a2a' : 'white'};
          transition: all 0.3s ease;
          padding: 2px;
        }
        
        .logo-image:hover {
          box-shadow: 0 4px 12px rgba(0,0,0,0.25);
          border-color: ${themeColors.focus || themeColors.secondary};
        }
        
        .logo-image.small {
          border-width: 1px;
          padding: 1px;
        }
        
        .logo-image.large {
          border-width: 3px;
          padding: 3px;
        }

        .footer-logo .styled-logo {
          margin-right: 12px;
        }
        
        /* Make logo more noticeable on smaller screens */
        @media (max-width: 576px) {
          .styled-logo {
            margin-right: 8px;
          }
          
          .logo-image {
            border-width: 1px;
          }
        }

        .newsletter-form .ant-form-item-explain-error {
          font-size: 12px;
          margin-top: 4px;
          color: #ff4d4f;
        }

        .newsletter-form .ant-input-status-error {
          border-color: #ff4d4f !important;
          background: ${isDarkMode ? 'rgba(255,77,79,0.1)' : 'rgba(255,77,79,0.05)'} !important;
        }

        .newsletter-form .ant-input-status-error:hover {
          border-color: #ff7875 !important;
        }
        
      `}</style>
    </Layout>
  );
};

export default Home;