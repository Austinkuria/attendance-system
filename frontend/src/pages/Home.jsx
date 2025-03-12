import { Layout, Button, Typography, Row, Col, Card, Space, Collapse, Carousel, Spin } from 'antd';
import { useNavigate } from 'react-router-dom';
import { QrcodeOutlined, ClockCircleOutlined, SafetyOutlined, MessageOutlined, ArrowLeftOutlined, ArrowRightOutlined, TeamOutlined, LineChartOutlined, FormOutlined } from '@ant-design/icons';
import { animated, useSpring } from '@react-spring/web';
import { useState, useEffect, useContext } from 'react';
import { ThemeContext } from "../context/ThemeContext";
import ThemeToggle from '../components/ThemeToggle';

const { Header, Content, Footer } = Layout;
const { Title, Text } = Typography;
const { Panel } = Collapse;

const Home = () => {
  const navigate = useNavigate();
  const { themeColors, isDarkMode } = useContext(ThemeContext);
  const [loading, setLoading] = useState(true);

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
    minHeight: '220px',
    transition: 'transform 0.3s ease',
    background: 'inherit',
  };

  return (
    <Layout style={{ minHeight: '100vh', background: themeColors.background, margin: 0, padding: 0, overflowX: 'hidden', border: '4px solid green' }}>
      {/* Header */}
      <Header style={{
        background: themeColors.cardBg,
        padding: '0 16px',
        position: 'fixed',
        borderBottom: '4px solid yellow',
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
              <img
                src="../assets/icon.svg"
                alt="QRollCall Logo"
                style={{ width: 40, height: 40, marginRight: 8 }}
              />
              <Title level={3} style={{ color: themeColors.text, margin: 0, fontSize: '24px', lineHeight: 'inherit' }}>QRollCall</Title>
            </Space>
          </Col>
          <Col xs={6} sm={12} md={6} style={{ textAlign: 'right' }}>
            <Space size="small" style={{ height: '100%', lineHeight: 'inherit' }}>
              <Button
                ghost
                className='ant-btn-signup'
                onClick={() => navigate('/auth/login')}
                style={{
                  borderColor: themeColors.primary,
                  borderRadius: '8px',
                  margin: '0 4px',
                  lineHeight: 'inherit',
                  background: themeColors.cardBg,
                  transition: 'background-color 0.3s ease, color 0.3s ease',
                  ...(isDarkMode ? { color: '#fff' } : { color: themeColors.text }),
                }}
              >
                SignUp
              </Button>
              <ThemeToggle />
            </Space>
          </Col>
        </Row>
      </Header>

      <Content style={{ margin: '20px 0 0 0', border: '4px solid red', padding: '0', background: themeColors.background }}>
        {/* Hero Section */}
        <section style={{
          padding: '30px 16px',
          marginTop: '36px',
          border: `3px solid ${themeColors.text}`,
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
              Scan. Track. Engage. A smarter way to manage Students&apos; attendance.
            </Text>
          </animated.div>
          <animated.div style={{ ...qrAnimation, marginBottom: '20px' }}>
            <QrcodeOutlined style={{ fontSize: 'clamp(120px, 20vw, 200px)', color: themeColors.text }} />
          </animated.div>
          <Space size="large" wrap>
            <Button
              type="primary"
              size="large"
              onClick={() => navigate('/auth/login')}
              style={{ padding: '0 40px', height: '50px', background: themeColors.primary, borderColor: themeColors.primary, borderRadius: '8px', fontSize: '16px' }}
            >
              Get Started
              <ArrowRightOutlined />

            </Button>
            <Button
              size="large"
              className='ant-btn-explore'
              onClick={() => document.getElementById('features').scrollIntoView({ behavior: 'smooth' })}
              style={{
                padding: '0 40px', height: '50px',
                color: themeColors.text, borderColor: themeColors.secondary, background: 'transparent',
                borderRadius: '8px', fontSize: '16px', transition: 'background-color 0.3s ease, color 0.3s ease'
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
          <Row gutter={[16, 16]} justify="center">
            <Col xs={24} sm={12} md={8}>
              <Card hoverable style={{ ...featureCardStyle, background: themeColors.cardGradient1 }}>
                <ClockCircleOutlined style={{ fontSize: '40px', color: '#fff' }} />
                <Title level={4} style={{ margin: '16px 0', color: '#fff', fontSize: '20px' }}>Instant Precision</Title>
                <Text style={{ color: '#fff', fontSize: '16px' }}>
                  Attendance updates in real-time with pinpoint accuracy for every session.
                </Text>
              </Card>
            </Col>
            <Col xs={24} sm={12} md={8}>
              <Card hoverable style={{ ...featureCardStyle, background: themeColors.cardGradient2 }}>
                <SafetyOutlined style={{ fontSize: '40px', color: '#fff' }} />
                <Title level={4} style={{ margin: '16px 0', color: '#fff', fontSize: '20px' }}>Fraud-Proof</Title>
                <Text style={{ color: '#fff', fontSize: '16px' }}>
                  Dynamic QR codes, unique device tracking, and secure authentication stop proxy attendance in its tracks.
                </Text>
              </Card>
            </Col>
            <Col xs={24} sm={12} md={8}>
              <Card hoverable style={{ ...featureCardStyle, background: themeColors.cardGradient3 }}>
                <MessageOutlined style={{ fontSize: '40px', color: '#fff' }} />
                <Title level={4} style={{ margin: '16px 0', color: '#fff', fontSize: '20px' }}>Engage Students</Title>
                <Text style={{ color: '#fff', fontSize: '16px' }}>
                  Interactive feedback and dashboards spark student participation and insights.
                </Text>
              </Card>
            </Col>
            <Col xs={24} sm={12} md={8}>
              <Card hoverable style={{ ...featureCardStyle, background: themeColors.cardGradient4 || themeColors.cardGradient1 }}>
                <TeamOutlined style={{ fontSize: '40px', color: '#fff' }} />
                <Title level={4} style={{ margin: '16px 0', color: '#fff', fontSize: '20px' }}>Comprehensive Oversight</Title>
                <Text style={{ color: '#fff', fontSize: '16px' }}>
                  Monitor students, courses, and attendance effortlessly in one powerful dashboard.
                </Text>
              </Card>
            </Col>
            <Col xs={24} sm={12} md={8}>
              <Card hoverable style={{ ...featureCardStyle, background: themeColors.cardGradient5 || themeColors.cardGradient2 }}>
                <LineChartOutlined style={{ fontSize: '40px', color: '#fff' }} />
                <Title level={4} style={{ margin: '16px 0', color: '#fff', fontSize: '20px' }}>Data-Driven Insights</Title>
                <Text style={{ color: '#fff', fontSize: '16px' }}>
                  Unlock actionable analytics to boost attendance and performance.
                </Text>
              </Card>
            </Col>
            <Col xs={24} sm={12} md={8}>
              <Card hoverable style={{ ...featureCardStyle, background: themeColors.cardGradient6 || themeColors.cardGradient3 }}>
                <FormOutlined style={{ fontSize: '40px', color: '#fff' }} />
                <Title level={4} style={{ margin: '16px 0', color: '#fff', fontSize: '20px' }}>Streamlined Management</Title>
                <Text style={{ color: '#fff', fontSize: '16px' }}>
                  Simplify attendance and session tracking with an intuitive interface.
                </Text>
              </Card>
            </Col>
          </Row>
        </section>

        {/* Video Demo Section */}
        <section style={{ padding: '60px 16px', background: themeColors.cardBg, width: '100%', boxSizing: 'border-box' }}>
          <Title level={2} style={{ marginBottom: '40px', color: themeColors.text, fontSize: 'clamp(28px, 5vw, 36px)', textAlign: 'center' }}>See It in Action</Title>
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
              }}>
                <iframe
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    border: 'none',
                  }}
                  src="https://www.youtube.com/embed/dQw4w9WgXcQ?si=your-placeholder-id"
                  title="QRollCall Demo"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                ></iframe>
              </div>
              <Text style={{ display: 'block', marginTop: '16px', color: themeColors.text, fontSize: '16px', opacity: 0.85, textAlign: 'center' }}>
                Discover QRollCall in just 90 seconds!
              </Text>
            </Col>
          </Row>
        </section>

        {/* Testimonials */}
        <section style={{ padding: '60px 16px', background: themeColors.background, width: '100%', boxSizing: 'border-box' }}>
          <Title level={2} style={{ marginBottom: '40px', color: themeColors.text, fontSize: 'clamp(28px, 5vw, 36px)', textAlign: 'center' }}>What Educators Say</Title>
          <Carousel autoplay dots={{ className: 'custom-dots' }} style={{ maxWidth: '800px', margin: '0 auto' }}>
            <div>
              <Card style={{ ...featureCardStyle, background: themeColors.cardGradient1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                <Text style={{ color: '#fff', fontSize: '15px', lineHeight: '1.5', textAlign: 'center', padding: '0 10px' }}>"QRollCall halved our attendance time."</Text>
                <Text strong block style={{ marginTop: '12px', color: '#fff', fontSize: '16px', textAlign: 'center' }}>- Dr. Maya Patel, Horizon University</Text>
              </Card>
            </div>
            <div>
              <Card style={{ ...featureCardStyle, background: themeColors.cardGradient2, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                <Text style={{ color: '#fff', fontSize: '15px', lineHeight: '1.5', textAlign: 'center', padding: '0 10px' }}>"Device tracking ended proxy attendance."</Text>
                <Text strong block style={{ marginTop: '12px', color: '#fff', fontSize: '16px', textAlign: 'center' }}>- Prof. Liam Carter, Summit College</Text>
              </Card>
            </div>
            <div>
              <Card style={{ ...featureCardStyle, background: themeColors.cardGradient3, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                <Text style={{ color: '#fff', fontSize: '15px', lineHeight: '1.5', textAlign: 'center', padding: '0 10px' }}>"Feedback feature sparked real dialogue."</Text>
                <Text strong block style={{ marginTop: '12px', color: '#fff', fontSize: '16px', textAlign: 'center' }}>- Ms. Elena Ortiz, Bright Academy</Text>
              </Card>
            </div>
          </Carousel>
        </section>

        {/* FAQ Section */}
        <section style={{ padding: '60px 16px', background: themeColors.cardBg, width: '100%', boxSizing: 'border-box' }}>
          <Title level={2} style={{ marginBottom: '40px', color: themeColors.text, fontSize: 'clamp(28px, 5vw, 36px)', textAlign: 'center' }}>Frequently Asked Questions</Title>
          <Collapse
            accordion
            bordered={false}
            style={{ background: themeColors.cardBg, borderRadius: '12px', border: `1px solid ${themeColors.border}`, maxWidth: '800px', margin: '0 auto' }}
          >
            <Panel header={<span style={{ color: themeColors.text, fontSize: '16px' }}>How does QRollCall work?</span>} key="1">
              <Text style={{ color: themeColors.text, fontSize: '14px' }}>Generate a QR code per class. Students scan it, and attendance logs instantly.</Text>
            </Panel>
            <Panel header={<span style={{ color: themeColors.text, fontSize: '16px' }}>How does it prevent proxy attendance?</span>} key="2">
              <Text style={{ color: themeColors.text, fontSize: '14px' }}>Unique device IDs and expiring QR codes ensure authenticity.</Text>
            </Panel>
            <Panel header={<span style={{ color: themeColors.text, fontSize: '16px' }}>How does it engage students?</span>} key="3">
              <Text style={{ color: themeColors.text, fontSize: '14px' }}>Post-scan feedback fosters interaction and insights.</Text>
            </Panel>
          </Collapse>
        </section>

        {/* Roadmap */}
        <section style={{ padding: '60px 16px', background: themeColors.background, width: '100%', boxSizing: 'border-box' }}>
          <Title level={2} style={{ marginBottom: '48px', color: themeColors.text, fontSize: 'clamp(28px, 5vw, 36px)', textAlign: 'center' }}>What’s Next</Title>
          <Row gutter={[16, 16]} justify="center">
            <Col xs={24} sm={12} md={8}>
              <Card hoverable style={{ ...featureCardStyle, background: themeColors.cardGradient1 }}>
                <Title level={4} style={{ color: '#fff', fontSize: '20px' }}>Q1 2026</Title>
                <Text style={{ color: '#fff', fontSize: '16px' }}>Rich engagement dashboards</Text>
              </Card>
            </Col>
            <Col xs={24} sm={12} md={8}>
              <Card hoverable style={{ ...featureCardStyle, background: themeColors.cardGradient2 }}>
                <Title level={4} style={{ color: '#fff', fontSize: '20px' }}>Q2 2026</Title>
                <Text style={{ color: '#fff', fontSize: '16px' }}>Facial recognition security</Text>
              </Card>
            </Col>
            <Col xs={24} sm={12} md={8}>
              <Card hoverable style={{ ...featureCardStyle, background: themeColors.cardGradient3 }}>
                <Title level={4} style={{ color: '#fff', fontSize: '20px' }}>Q3 2026</Title>
                <Text style={{ color: '#fff', fontSize: '16px' }}>Global language support</Text>
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
            Join other Institutions worldwide in simplifying attendance with QRollCall.
          </Text>
          <Button
            type="primary"
            size="large"
            onClick={() => navigate('/auth/login')}
            style={{ padding: '0 50px', height: '60px', fontSize: '18px', background: themeColors.primary, borderColor: themeColors.primary, borderRadius: '8px' }}
          >
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
        .ant-btn-ghost:hover, .ant-btn-signup:hover {
          background: ${themeColors.primary} !important;
          border-color: ${themeColors.secondary} !important;
          color: #fff !important;
        }
        .ant-btn-explore:hover {
          background: ${themeColors.secondary} !important;
          color: ${isDarkMode ? '#000' : '#fff'} !important;
          border-color: ${themeColors.secondary} !important;
        }
        .ant-btn-primary:hover, .ant-btn-primary:focus {
          background: ${themeColors.focus} !important;
          border-color: ${themeColors.focus} !important;
          color: ${themeColors.text} !important;
        }
        .ant-collapse-header {
          color: ${themeColors.text} !important;
          font-size: 16px !important;
          padding: 16px !important;
        }
        .ant-collapse-content {
          background: ${themeColors.cardBg} !important;
          color: ${themeColors.text} !important;
          padding: 16px !important;
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
        }
        @media (max-width: 767px) { /* Medium screens (md) */
          .ant-row {
            flex-direction: row !important;
            flex-wrap: wrap !important; /* Allow wrapping for cards */
          }
          .ant-col {
            padding: 0 8px !important;
          }
          .ant-space {
            flex-wrap: wrap !important; /* Allow wrapping for header buttons */
          }
        }
        @media (max-width: 576px) { /* Small screens (xs) */
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
          .ant-space {
            flex-wrap: wrap !important;
          }
          .ant-row {
            flex-direction: column !important; /* Stack cards vertically */
          }
        }
      `}</style>
    </Layout>
  );
};

export default Home;