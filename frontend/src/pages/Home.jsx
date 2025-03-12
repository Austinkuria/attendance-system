import { Layout, Button, Typography, Row, Col, Card, Space, Carousel, Spin, Collapse } from 'antd';
const { Panel } = Collapse;
import { useNavigate } from 'react-router-dom';
import { QrcodeOutlined, ClockCircleOutlined, SafetyOutlined, MessageOutlined, ArrowRightOutlined, TeamOutlined, LineChartOutlined, FormOutlined, EyeOutlined, CalendarOutlined, DownloadOutlined, DownOutlined, UpOutlined } from '@ant-design/icons';
import { animated, useSpring } from '@react-spring/web';
import { useState, useEffect, useContext } from 'react';
import { ThemeContext } from "../context/ThemeContext";
import ThemeToggle from '../components/ThemeToggle';

const { Header, Content, Footer } = Layout;
const { Title, Text } = Typography;

const Home = () => {
  const navigate = useNavigate();
  const { themeColors, isDarkMode } = useContext(ThemeContext);
  const [loading, setLoading] = useState(true);
  const [showMoreFeatures, setShowMoreFeatures] = useState(false);

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
    transition: 'transform 0.3s ease, box-shadow 0.3s ease',
    background: 'inherit',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
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
          <Col xs={18} sm={12} md={6}>
            <Space align="center" style={{ height: '100%' }}>
              <img src="../assets/icon.svg" alt="QRollCall Logo" style={{ width: 40, height: 40, marginRight: 8 }} />
              <Title level={3} style={{ color: themeColors.text, margin: 0, fontSize: '24px', lineHeight: 'inherit' }}>QRollCall</Title>
            </Space>
          </Col>
          <Col xs={6} sm={12} md={6} style={{ textAlign: 'right' }}>
            <Space size="small" style={{ height: '100%', lineHeight: 'inherit' }}>
              <Button ghost onClick={() => navigate('/auth/login')} style={{ borderColor: themeColors.primary, borderRadius: '8px', margin: '0 4px', lineHeight: 'inherit', background: themeColors.cardBg, ...(isDarkMode ? { color: '#fff' } : { color: themeColors.text }) }}>
                Sign Up
              </Button>
              <ThemeToggle />
            </Space>
          </Col>
        </Row>
      </Header>

      <Content style={{ margin: '20px 0 0 0', padding: '0', background: themeColors.background }}>
        {/* Hero Section */}
        <section style={{
          padding: '30px 16px',
          marginTop: '36px',
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
            <Button size="large" onClick={() => document.getElementById('features').scrollIntoView({ behavior: 'smooth' })} style={{ padding: '0 40px', height: '50px', color: themeColors.text, borderColor: themeColors.secondary, background: 'transparent', borderRadius: '8px', fontSize: '16px' }}>
              Explore Features
            </Button>
          </Space>
        </section>

        {/* Features Grid */}
        <section id="features" style={{ padding: '60px 16px', background: themeColors.background, width: '100%', boxSizing: 'border-box' }}>
          <Title level={2} style={{ marginBottom: '48px', color: themeColors.text, fontSize: 'clamp(28px, 5vw, 36px)', textAlign: 'center' }}>
            Why QRollCall?
          </Title>
          <Row gutter={[16, 16]} justify="center">
            {features.slice(0, 3).map((feature, index) => (
              <Col xs={24} sm={12} md={8} key={index}>
                <Card hoverable style={{ ...featureCardStyle, background: feature.gradient }}>
                  {feature.icon}
                  <Title level={4} style={{ margin: '16px 0', color: '#fff', fontSize: '20px' }}>{feature.title}</Title>
                  <Text style={{ color: '#fff', fontSize: '16px', flexGrow: 1 }}>{feature.text}</Text>
                </Card>
              </Col>
            ))}
          </Row>
          <animated.div style={featureRevealAnimation}>
            {showMoreFeatures && (
              <Row gutter={[16, 16]} justify="center" style={{ marginTop: '16px' }}>
                {features.slice(3).map((feature, index) => (
                  <Col xs={24} sm={12} md={8} key={index}>
                    <Card hoverable style={{ ...featureCardStyle, background: feature.gradient }}>
                      {feature.icon}
                      <Title level={4} style={{ margin: '16px 0', color: '#fff', fontSize: '20px' }}>{feature.title}</Title>
                      <Text style={{ color: '#fff', fontSize: '16px', flexGrow: 1 }}>{feature.text}</Text>
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
        <section style={{ padding: '60px 16px', background: themeColors.cardBg, width: '100%', boxSizing: 'border-box' }}>
          <Title level={2} style={{ marginBottom: '40px', color: themeColors.text, fontSize: 'clamp(28px, 5vw, 36px)', textAlign: 'center' }}>
            Benefits for Everyone
          </Title>
          <Row gutter={[24, 24]} justify="center">
            <Col xs={24} sm={12} md={8}>
              <Card hoverable style={{ ...featureCardStyle, background: themeColors.cardGradient1 }}>
                <TeamOutlined style={{ fontSize: '40px', color: '#fff' }} />
                <Title level={4} style={{ margin: '16px 0', color: '#fff', fontSize: '20px' }}>For Students</Title>
                <Text style={{ color: '#fff', fontSize: '16px' }}>
                  Quick scans, interactive feedback, and clear attendance insights keep you engaged.
                </Text>
              </Card>
            </Col>
            <Col xs={24} sm={12} md={8}>
              <Card hoverable style={{ ...featureCardStyle, background: themeColors.cardGradient2 }}>
                <FormOutlined style={{ fontSize: '40px', color: '#fff' }} />
                <Title level={4} style={{ margin: '16px 0', color: '#fff', fontSize: '20px' }}>For Lecturers</Title>
                <Text style={{ color: '#fff', fontSize: '16px' }}>
                  Effortless session management, real-time tracking, and historical records at your fingertips.
                </Text>
              </Card>
            </Col>
            <Col xs={24} sm={12} md={8}>
              <Card hoverable style={{ ...featureCardStyle, background: themeColors.cardGradient3 }}>
                <LineChartOutlined style={{ fontSize: '40px', color: '#fff' }} />
                <Title level={4} style={{ margin: '16px 0', color: '#fff', fontSize: '20px' }}>For Admins</Title>
                <Text style={{ color: '#fff', fontSize: '16px' }}>
                  Centralized oversight, detailed analytics, and fraud prevention streamline operations.
                </Text>
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

        {/* Testimonials */}
        <section style={{ padding: '60px 16px', background: themeColors.cardBg, width: '100%', boxSizing: 'border-box' }}>
          <Title level={2} style={{ marginBottom: '40px', color: themeColors.text, fontSize: 'clamp(28px, 5vw, 36px)', textAlign: 'center' }}>
            What Educators Say
          </Title>
          <Carousel autoplay dots={{ className: 'custom-dots' }} style={{ maxWidth: '800px', margin: '0 auto' }}>
            <div>
              <Card style={{ ...featureCardStyle, background: themeColors.cardGradient1 }}>
                <Text style={{ color: '#fff', fontSize: '15px', lineHeight: '1.5', textAlign: 'center', padding: '0 10px' }}>"QRollCall halved our attendance time."</Text>
                <Text strong block style={{ marginTop: '12px', color: '#fff', fontSize: '16px', textAlign: 'center' }}>- Dr. Maya Patel, Horizon University</Text>
              </Card>
            </div>
            <div>
              <Card style={{ ...featureCardStyle, background: themeColors.cardGradient2 }}>
                <Text style={{ color: '#fff', fontSize: '15px', lineHeight: '1.5', textAlign: 'center', padding: '0 10px' }}>"Device tracking ended proxy attendance."</Text>
                <Text strong block style={{ marginTop: '12px', color: '#fff', fontSize: '16px', textAlign: 'center' }}>- Prof. Liam Carter, Summit College</Text>
              </Card>
            </div>
            <div>
              <Card style={{ ...featureCardStyle, background: themeColors.cardGradient3 }}>
                <Text style={{ color: '#fff', fontSize: '15px', lineHeight: '1.5', textAlign: 'center', padding: '0 10px' }}>"Feedback feature sparked real dialogue."</Text>
                <Text strong block style={{ marginTop: '12px', color: '#fff', fontSize: '16px', textAlign: 'center' }}>- Ms. Elena Ortiz, Bright Academy</Text>
              </Card>
            </div>
          </Carousel>
        </section>

        {/* FAQ Section */}
        <section style={{ padding: '60px 16px', background: themeColors.background, width: '100%', boxSizing: 'border-box' }}>
          <Title level={2} style={{ marginBottom: '40px', color: themeColors.text, fontSize: 'clamp(28px, 5vw, 36px)', textAlign: 'center' }}>
            Frequently Asked Questions
          </Title>
          <div style={{ maxWidth: '800px', margin: '0 auto' }}>
            <Collapse accordion bordered={false} style={{ background: themeColors.cardBg, borderRadius: '12px', border: `1px solid ${themeColors.border}` }}>
              <Panel header={<span style={{ color: themeColors.text, fontSize: '16px' }}>How does QRollCall work?</span>} key="1">
                <Text style={{ color: themeColors.text, fontSize: '14px' }}>Lecturers generate a QR code per session. Students scan it via their dashboard, and attendance logs instantly with real-time updates.</Text>
              </Panel>
              <Panel header={<span style={{ color: themeColors.text, fontSize: '16px' }}>How does it prevent proxy attendance?</span>} key="2">
                <Text style={{ color: themeColors.text, fontSize: '14px' }}>Dynamic QR codes expire quickly, and unique device IDs paired with secure authentication ensure only the right student marks attendance.</Text>
              </Panel>
              <Panel header={<span style={{ color: themeColors.text, fontSize: '16px' }}>How does it benefit lecturers?</span>} key="3">
                <Text style={{ color: themeColors.text, fontSize: '14px' }}>Real-time tracking, flexible session controls, and exportable historical records simplify attendance management.</Text>
              </Panel>
              <Panel header={<span style={{ color: themeColors.text, fontSize: '16px' }}>What’s in it for administrators?</span>} key="4">
                <Text style={{ color: themeColors.text, fontSize: '14px' }}>A centralized dashboard offers oversight of students, courses, and attendance, with analytics to optimize institutional performance.</Text>
              </Panel>
            </Collapse>
          </div>
        </section>

        {/* Roadmap */}
        <section style={{ padding: '60px 16px', background: themeColors.cardBg, width: '100%', boxSizing: 'border-box' }}>
          <Title level={2} style={{ marginBottom: '48px', color: themeColors.text, fontSize: 'clamp(28px, 5vw, 36px)', textAlign: 'center' }}>
            What’s Next for QRollCall
          </Title>
          <Row gutter={[16, 16]} justify="center">
            <Col xs={24} sm={12} md={8}>
              <Card hoverable style={{ ...featureCardStyle, background: themeColors.cardGradient1 }}>
                <Title level={4} style={{ color: '#fff', fontSize: '20px' }}>Q1 2026</Title>
                <Text style={{ color: '#fff', fontSize: '16px' }}>Rich engagement dashboards for deeper student insights.</Text>
              </Card>
            </Col>
            <Col xs={24} sm={12} md={8}>
              <Card hoverable style={{ ...featureCardStyle, background: themeColors.cardGradient2 }}>
                <Title level={4} style={{ color: '#fff', fontSize: '20px' }}>Q2 2026</Title>
                <Text style={{ color: '#fff', fontSize: '16px' }}>Facial recognition to enhance attendance security.</Text>
              </Card>
            </Col>
            <Col xs={24} sm={12} md={8}>
              <Card hoverable style={{ ...featureCardStyle, background: themeColors.cardGradient3 }}>
                <Title level={4} style={{ color: '#fff', fontSize: '20px' }}>Q3 2026</Title>
                <Text style={{ color: '#fff', fontSize: '16px' }}>Global language support for worldwide accessibility.</Text>
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

      {/* Footer */}
      <Footer style={{ background: themeColors.cardBg, color: themeColors.text, padding: '40px 16px', textAlign: 'center', borderTop: `1px solid ${themeColors.border}`, width: '100%', boxSizing: 'border-box' }}>
        <Row gutter={[16, 16]} justify="center">
          <Col xs={24} md={8}>
            <Title level={4} style={{ color: themeColors.text, fontSize: '20px' }}>QRollCall</Title>
            <Text style={{ color: themeColors.text, fontSize: '14px' }}>Smart attendance for smarter education.</Text>
          </Col>
          <Col xs={24} md={8}>
            <Title level={4} style={{ color: themeColors.text, fontSize: '20px' }}>Links</Title>
            <Space direction="vertical">
              <a href="#features" style={{ color: themeColors.text, fontSize: '14px' }}>Features</a>
              <a href="#benefits" style={{ color: themeColors.text, fontSize: '14px' }}>Benefits</a>
              <a href="#testimonials" style={{ color: themeColors.text, fontSize: '14px' }}>Testimonials</a>
              <a href="#faq" style={{ color: themeColors.text, fontSize: '14px' }}>FAQ</a>
            </Space>
          </Col>
          <Col xs={24} md={8}>
            <Title level={4} style={{ color: themeColors.text, fontSize: '20px' }}>Contact</Title>
            <Text style={{ color: themeColors.text, fontSize: '14px' }}>Email: hello@qrollcall.com</Text>
            <br />
            <Text style={{ color: themeColors.text, fontSize: '14px' }}>Phone: +1 (555) 123-4567</Text>
          </Col>
        </Row>
        <Text style={{ color: themeColors.text, fontSize: '12px', display: 'block', marginTop: '24px' }}>
          © {new Date().getFullYear()} QRollCall. All rights reserved.
        </Text>
      </Footer>

      <style>{`
        html, body {
          margin: 0;
          padding: 0;
          overflow-x: hidden;
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
        }
        @media (max-width: 576px) {
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
            padding: 40px 8px !important;
          }
        }
      `}</style>
    </Layout>
  );
};

export default Home;