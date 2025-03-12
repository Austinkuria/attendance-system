import { Layout, Button, Typography, Row, Col, Card, Space, Collapse, Carousel, Spin } from 'antd';
import { useNavigate } from 'react-router-dom';
import { QrcodeOutlined, ClockCircleOutlined, SafetyOutlined, TeamOutlined, GlobalOutlined, MessageOutlined } from '@ant-design/icons';
import { animated, useSpring } from '@react-spring/web';
import { useState, useEffect, useContext } from 'react';
import { ThemeContext } from "../context/ThemeContext";
import ThemeToggle from '../components/ThemeToggle';

const { Header, Content, Footer } = Layout;
const { Title, Text } = Typography;
const { Panel } = Collapse;

const Home = () => {
  const navigate = useNavigate();
  const { themeColors } = useContext(ThemeContext);
  const [loading, setLoading] = useState(true);
  const [scanCount, setScanCount] = useState(0);

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
    delay: 400,
  });

  // Simulate live scan counter
  useEffect(() => {
    const interval = setInterval(() => {
      setScanCount((prev) => prev + Math.floor(Math.random() * 3) + 1);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  // Simulate loading delay
  useEffect(() => {
    setTimeout(() => setLoading(false), 1000);
  }, []);

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
  };

  return (
    <Layout style={{ minHeight: '100vh', background: themeColors.background }}>
      {/* Header */}
      <Header style={{ background: themeColors.cardBg, padding: '16px 24px', position: 'fixed', width: '100%', zIndex: 10, borderBottom: `1px solid ${themeColors.border}` }}>
        <Row justify="space-between" align="middle">
          <Col xs={12} md={6}>
            <Title level={3} style={{ color: themeColors.text, margin: 0, fontSize: '24px' }}>QRollCall</Title>
          </Col>
          <Col xs={12} md={6} style={{ textAlign: 'right' }}>
            <Space size="middle">
              <Button ghost onClick={() => navigate('/auth/login')} style={{ color: themeColors.primary, borderColor: themeColors.primary, borderRadius: '8px' }}>
                Try Now
              </Button>
              <ThemeToggle />
            </Space>
          </Col>
        </Row>
      </Header>

      <Content style={{ marginTop: 64, background: themeColors.background }}>
        {/* Hero Section */}
        <section style={{ 
          padding: '100px 24px', 
          background: `linear-gradient(135deg, ${themeColors.cardGradient1} 0%, ${themeColors.cardGradient2} 100%)`,
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center', 
          justifyContent: 'center',
          minHeight: '80vh',
        }}>
          <Title level={1} style={{ marginBottom: '24px', color: '#fff', fontSize: '48px', textShadow: '0 2px 8px rgba(0,0,0,0.2)' }}>
            Attendance, Redefined
          </Title>
          <animated.div style={taglineAnimation}>
            <Text style={{ fontSize: '22px', color: '#fff', display: 'block', marginBottom: '40px', opacity: 0.9, maxWidth: '600px', lineHeight: 1.5 }}>
              Scan. Track. Engage. A smarter way to manage attendance.
            </Text>
          </animated.div>
          <animated.div
            style={{ ...qrAnimation, fontSize: '200px', color: '#fff', marginBottom: '40px' }}
          >
            <QrcodeOutlined />
          </animated.div>
          <Space size="large" wrap>
            <Button
              type="primary"
              size="large"
              onClick={() => navigate('/auth/login')}
              style={{ padding: '0 40px', height: '50px', background: themeColors.primary, borderColor: themeColors.primary, borderRadius: '8px', fontSize: '16px' }}
            >
              Start Free Trial
            </Button>
            <Button
              size="large"
              onClick={() => document.getElementById('features').scrollIntoView({ behavior: 'smooth' })}
              style={{ padding: '0 40px', height: '50px', color: themeColors.text, borderColor: themeColors.secondary, background: 'transparent', borderRadius: '8px', fontSize: '16px' }}
            >
              Explore Features
            </Button>
          </Space>
        </section>

        {/* Live Counter */}
        <section style={{ padding: '20px 24px', background: themeColors.cardBg, textAlign: 'center' }}>
          <Text strong style={{ fontSize: '18px', color: themeColors.secondary }}>
            <ClockCircleOutlined style={{ marginRight: 8 }} /> Live Scans: {scanCount.toLocaleString()}
          </Text>
        </section>

        {/* Features Grid */}
        <section id="features" style={{ padding: '80px 24px', background: themeColors.background }}>
          <Title level={2} style={{ marginBottom: '48px', color: themeColors.text, fontSize: '36px' }}>Why QRollCall?</Title>
          <Row gutter={[24, 24]} justify="center">
            <Col xs={24} sm={12} md={8}>
              <Card hoverable style={{ ...featureCardStyle, background: themeColors.cardGradient1 }}>
                <ClockCircleOutlined style={{ fontSize: '40px', color: '#fff' }} />
                <Title level={4} style={{ margin: '16px 0', color: '#fff', fontSize: '20px' }}>Instant Precision</Title>
                <Text style={{ color: '#fff', fontSize: '16px' }}>Real-time QR scans for accurate attendance tracking.</Text>
              </Card>
            </Col>
            <Col xs={24} sm={12} md={8}>
              <Card hoverable style={{ ...featureCardStyle, background: themeColors.cardGradient2 }}>
                <SafetyOutlined style={{ fontSize: '40px', color: '#fff' }} />
                <Title level={4} style={{ margin: '16px 0', color: '#fff', fontSize: '20px' }}>Fraud-Proof</Title>
                <Text style={{ color: '#fff', fontSize: '16px' }}>Dynamic QR codes and device tracking prevent proxies.</Text>
              </Card>
            </Col>
            <Col xs={24} sm={12} md={8}>
              <Card hoverable style={{ ...featureCardStyle, background: themeColors.cardGradient3 }}>
                <MessageOutlined style={{ fontSize: '40px', color: '#fff' }} />
                <Title level={4} style={{ margin: '16px 0', color: '#fff', fontSize: '20px' }}>Engage Students</Title>
                <Text style={{ color: '#fff', fontSize: '16px' }}>Feedback after scans boosts student interaction.</Text>
              </Card>
            </Col>
          </Row>
        </section>

        {/* Video Demo Section */}
        <section style={{ padding: '80px 24px', background: themeColors.cardBg }}>
          <Title level={2} style={{ marginBottom: '40px', color: themeColors.text, fontSize: '36px' }}>See It in Action</Title>
          <Row justify="center">
            <Col xs={24} md={16}>
              <div style={{
                position: 'relative',
                paddingBottom: '56.25%',
                height: 0,
                overflow: 'hidden',
                borderRadius: '12px',
                border: `1px solid ${themeColors.border}`,
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
              <Text style={{ display: 'block', marginTop: '16px', color: themeColors.text, fontSize: '16px', opacity: 0.85 }}>
                Discover QRollCall in just 90 seconds!
              </Text>
            </Col>
          </Row>
        </section>

        {/* Testimonials */}
        <section style={{ padding: '80px 24px', background: themeColors.background }}>
          <Title level={2} style={{ marginBottom: '40px', color: themeColors.text, fontSize: '36px' }}>What Educators Say</Title>
          <Carousel autoplay dots={{ className: 'custom-dots' }} style={{ maxWidth: '800px', margin: '0 auto' }}>
            <div>
              <Card style={{ background: themeColors.cardGradient1, borderRadius: '12px', border: 'none', padding: '24px', margin: '0 16px' }}>
                <Text style={{ color: '#fff', fontSize: '16px' }}>"QRollCall halved our attendance time."</Text>
                <Text strong block style={{ marginTop: '12px', color: '#fff', fontSize: '14px' }}>- Dr. Maya Patel, Horizon University</Text>
              </Card>
            </div>
            <div>
              <Card style={{ background: themeColors.cardGradient2, borderRadius: '12px', border: 'none', padding: '24px', margin: '0 16px' }}>
                <Text style={{ color: '#fff', fontSize: '16px' }}>"Device tracking ended proxy attendance."</Text>
                <Text strong block style={{ marginTop: '12px', color: '#fff', fontSize: '14px' }}>- Prof. Liam Carter, Summit College</Text>
              </Card>
            </div>
            <div>
              <Card style={{ background: themeColors.cardGradient3, borderRadius: '12px', border: 'none', padding: '24px', margin: '0 16px' }}>
                <Text style={{ color: '#fff', fontSize: '16px' }}>"Feedback feature sparked real dialogue."</Text>
                <Text strong block style={{ marginTop: '12px', color: '#fff', fontSize: '14px' }}>- Ms. Elena Ortiz, Bright Academy</Text>
              </Card>
            </div>
          </Carousel>
        </section>

        {/* FAQ Section */}
        <section style={{ padding: '80px 24px', background: themeColors.cardBg }}>
          <Title level={2} style={{ marginBottom: '40px', color: themeColors.text, fontSize: '36px' }}>Frequently Asked Questions</Title>
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
        <section style={{ padding: '80px 24px', background: themeColors.background }}>
          <Title level={2} style={{ marginBottom: '48px', color: themeColors.text, fontSize: '36px' }}>What’s Next</Title>
          <Row gutter={[24, 24]} justify="center">
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
          padding: '100px 24px', 
          background: `linear-gradient(135deg, ${themeColors.cardGradient3} 0%, ${themeColors.cardGradient1} 100%)`,
          textAlign: 'center',
        }}>
          <Title level={2} style={{ marginBottom: '24px', color: '#fff', fontSize: '36px', textShadow: '0 2px 8px rgba(0,0,0,0.2)' }}>
            Ready to Transform Attendance?
          </Title>
          <Text style={{ fontSize: '18px', marginBottom: '40px', display: 'block', color: '#fff', opacity: 0.9, maxWidth: '600px', margin: '0 auto 40px' }}>
            Join educators worldwide in simplifying attendance with QRollCall.
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
      <Footer style={{ background: themeColors.cardBg, color: themeColors.text, padding: '40px 24px', textAlign: 'center', borderTop: `1px solid ${themeColors.border}` }}>
        <Row gutter={[24, 24]} justify="center">
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
        .ant-btn-ghost:hover {
          color: ${themeColors.secondary} !important;
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
        @media (max-width: 576px) {
          .ant-typography h1 {
            font-size: 32px !important;
          }
          .ant-typography h2 {
            font-size: 28px !important;
          }
          .ant-btn {
            padding: 0 20px !important;
            height: 40px !important;
            font-size: 14px !important;
          }
        }
      `}</style>
    </Layout>
  );
};

export default Home;