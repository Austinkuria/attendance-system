import { Layout, Button, Typography, Row, Col, Card, Space, Collapse, Carousel, Spin } from 'antd';
import { useNavigate } from 'react-router-dom';
import { QrcodeOutlined, ClockCircleOutlined, SafetyOutlined, TeamOutlined, GlobalOutlined, MessageOutlined } from '@ant-design/icons';
import { animated, useSpring } from '@react-spring/web';
import { useState, useEffect, useContext } from 'react';
import { ThemeContext } from '../context/ThemeContext'; // Adjust path as needed
import ThemeToggle from '../components/ThemeToggle'; // Adjust path as needed

const { Header, Content, Footer } = Layout;
const { Title, Text } = Typography;
const { Panel } = Collapse;

// Animated QR code component
const AnimatedQR = animated(() => (
  <QrcodeOutlined style={{ fontSize: '220px' }} />
));

const Home = () => {
  const navigate = useNavigate();
  const { themeColors } = useContext(ThemeContext);
  const [loading, setLoading] = useState(true);
  const [scanCount, setScanCount] = useState(0);
  const qrAnimation = useSpring({
    from: { transform: 'scale(0)', opacity: 0 },
    to: { transform: 'scale(1)', opacity: 1 },
    config: { tension: 220, friction: 18 },
  });
  const taglineAnimation = useSpring({
    from: { opacity: 0, transform: 'translateY(20px)' },
    to: { opacity: 1, transform: 'translateY(0)' },
    delay: 300,
  });

  // Simulate live scan counter
  useEffect(() => {
    const interval = setInterval(() => {
      setScanCount((prev) => prev + Math.floor(Math.random() * 3) + 1);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  // Simulate loading delay
  useEffect(() => {
    setTimeout(() => setLoading(false), 1200);
  }, []);

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: themeColors.background }}>
        <Spin size="large" tip="Loading QRollCall..." />
      </div>
    );
  }

  return (
    <Layout style={{ minHeight: '100vh', textAlign: 'center', background: themeColors.background }}>
      {/* Header */}
      <Header style={{ background: themeColors.cardBg, padding: '16px', position: 'fixed', width: '100%', zIndex: 10 }}>
        <Row justify="space-between" align="middle">
          <Col>
            <Title level={3} style={{ color: themeColors.text, margin: 0 }}>QRollCall</Title>
          </Col>
          <Col>
            <Space>
              <Button ghost onClick={() => navigate('/auth/login')} style={{ color: themeColors.primary, borderColor: themeColors.primary }}>
                Try Now
              </Button>
              <ThemeToggle />
            </Space>
          </Col>
        </Row>
      </Header>

      <Content style={{ padding: '0 50px', marginTop: 64, background: themeColors.background }}>
        {/* Hero Section */}
        <section style={{ 
          padding: '120px 0', 
          background: `linear-gradient(145deg, ${themeColors.background} 0%, ${themeColors.cardBg} 100%)`,
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center', 
          justifyContent: 'center' 
        }}>
          <Title level={1} style={{ marginBottom: '20px', color: themeColors.text }}>
            Attendance, Redefined
          </Title>
          <animated.div style={taglineAnimation}>
            <Text style={{ fontSize: '20px', color: themeColors.text, display: 'block', marginBottom: '40px', opacity: 0.85 }}>
              Scan. Track. Engage. Attendance made simple and smart.
            </Text>
          </animated.div>
          <AnimatedQR style={{ ...qrAnimation, color: themeColors.secondary }} />
          <Space size="large" style={{ marginTop: '40px' }}>
            <Button
              type="primary"
              size="large"
              onClick={() => navigate('/auth/login')}
              style={{ padding: '0 40px', height: '50px', background: themeColors.primary, borderColor: themeColors.primary }}
            >
              Start Free Trial
            </Button>
            <Button
              size="large"
              onClick={() => document.getElementById('features').scrollIntoView({ behavior: 'smooth' })}
              style={{ padding: '0 40px', height: '50px', color: themeColors.text, borderColor: themeColors.secondary, background: 'transparent' }}
            >
              Explore Features
            </Button>
          </Space>
          <div style={{ marginTop: '40px' }}>
            <Text strong style={{ fontSize: '16px', color: themeColors.text }}>
              <GlobalOutlined /> Loved by educators in 20+ countries
            </Text>
          </div>
        </section>

        {/* Live Counter */}
        <section style={{ padding: '40px 0', background: themeColors.cardBg, boxShadow: '0 2px 10px rgba(0,0,0,0.1)' }}>
          <Title level={4} style={{ color: themeColors.secondary }}>
            <ClockCircleOutlined /> Live Scans: {scanCount.toLocaleString()}
          </Title>
        </section>

        {/* Features Grid */}
        <section id="features" style={{ padding: '80px 0', background: themeColors.background }}>
          <Title level={2} style={{ marginBottom: '60px', color: themeColors.text }}>Why QRollCall?</Title>
          <Row gutter={[40, 40]} justify="center">
            <Col xs={24} sm={12} md={8}>
              <Card hoverable style={{ borderRadius: '10px', background: themeColors.cardGradient1, border: 'none' }}>
                <ClockCircleOutlined style={{ fontSize: '40px', color: themeColors.text }} />
                <Title level={4} style={{ margin: '20px 0', color: themeColors.text }}>Instant Precision</Title>
                <Text style={{ color: themeColors.text }}>Real-time QR scans deliver accurate attendance updates instantly.</Text>
              </Card>
            </Col>
            <Col xs={24} sm={12} md={8}>
              <Card hoverable style={{ borderRadius: '10px', background: themeColors.cardGradient2, border: 'none' }}>
                <SafetyOutlined style={{ fontSize: '40px', color: themeColors.text }} />
                <Title level={4} style={{ margin: '20px 0', color: themeColors.text }}>Fraud-Proof</Title>
                <Text style={{ color: themeColors.text }}>Device tracking and dynamic QR codes stop proxy attendance.</Text>
              </Card>
            </Col>
            <Col xs={24} sm={12} md={8}>
              <Card hoverable style={{ borderRadius: '10px', background: themeColors.cardGradient1, border: 'none' }}>
                <MessageOutlined style={{ fontSize: '40px', color: themeColors.text }} />
                <Title level={4} style={{ margin: '20px 0', color: themeColors.text }}>Engage Students</Title>
                <Text style={{ color: themeColors.text }}>Post-session feedback boosts participation and insights.</Text>
              </Card>
            </Col>
          </Row>
        </section>

        {/* Video Demo Section */}
        <section style={{ padding: '80px 0', background: themeColors.cardBg }}>
          <Title level={2} style={{ marginBottom: '40px', color: themeColors.text }}>See QRollCall in Action</Title>
          <Row justify="center">
            <Col xs={24} md={18}>
              <div style={{
                position: 'relative',
                paddingBottom: '56.25%',
                height: 0,
                overflow: 'hidden',
                borderRadius: '10px',
                boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
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
              <Text style={{ display: 'block', marginTop: '20px', color: themeColors.text, opacity: 0.85 }}>
                Watch how QRollCall simplifies attendance in 90 seconds!
              </Text>
            </Col>
          </Row>
        </section>

        {/* Testimonials */}
        <section style={{ padding: '80px 0', background: themeColors.background }}>
          <Title level={2} style={{ marginBottom: '40px', color: themeColors.text }}>Voices of Educators</Title>
          <Carousel autoplay dots={{ className: 'custom-dots' }}>
            <div>
              <Card style={{ maxWidth: '600px', margin: '0 auto', background: themeColors.cardBg, borderColor: themeColors.primary }}>
                <Text style={{ color: themeColors.text }}>"QRollCall’s instant scans cut our attendance time in half."</Text>
                <Text strong block style={{ marginTop: '10px', color: themeColors.text }}>- Dr. Maya Patel, Horizon University</Text>
              </Card>
            </div>
            <div>
              <Card style={{ maxWidth: '600px', margin: '0 auto', background: themeColors.cardBg, borderColor: themeColors.primary }}>
                <Text style={{ color: themeColors.text }}>"No more proxy issues—device tracking is a game-changer."</Text>
                <Text strong block style={{ marginTop: '10px', color: themeColors.text }}>- Prof. Liam Carter, Summit College</Text>
              </Card>
            </div>
            <div>
              <Card style={{ maxWidth: '600px', margin: '0 auto', background: themeColors.cardBg, borderColor: themeColors.primary }}>
                <Text style={{ color: themeColors.text }}>"Students love the feedback feature—it’s sparked real dialogue."</Text>
                <Text strong block style={{ marginTop: '10px', color: themeColors.text }}>- Ms. Elena Ortiz, Bright Academy</Text>
              </Card>
            </div>
          </Carousel>
        </section>

        {/* Team & Training Section */}
        <section style={{ padding: '80px 0', background: themeColors.cardBg }}>
          <Title level={2} style={{ marginBottom: '40px', color: themeColors.text }}>Built for Teams</Title>
          <Row gutter={[40, 40]} justify="center">
            <Col xs={24} md={12}>
              <TeamOutlined style={{ fontSize: '100px', color: themeColors.secondary }} />
              <Title level={4} style={{ margin: '20px 0', color: themeColors.text }}>Team Sync</Title>
              <Text style={{ color: themeColors.text }}>Real-time data sharing for instructors and admins.</Text>
            </Col>
            <Col xs={24} md={12}>
              <TeamOutlined style={{ fontSize: '100px', color: themeColors.secondary }} />
              <Title level={4} style={{ margin: '20px 0', color: themeColors.text }}>Fast Onboarding</Title>
              <Text style={{ color: themeColors.text }}>Interactive tutorials and 24/7 support to get you started.</Text>
            </Col>
          </Row>
        </section>

        {/* FAQ Section */}
        <section style={{ padding: '80px 0', background: themeColors.background }}>
          <Title level={2} style={{ marginBottom: '40px', color: themeColors.text }}>Got Questions?</Title>
          <Collapse accordion bordered={false} style={{ background: themeColors.cardBg, borderRadius: '10px', borderColor: themeColors.primary }}>
            <Panel header="How does QRollCall work?" key="1" style={{ color: themeColors.text }}>
              <Text style={{ color: themeColors.text }}>Generate a QR code per class. Students scan it, and attendance logs instantly.</Text>
            </Panel>
            <Panel header="How does it stop proxy attendance?" key="2" style={{ color: themeColors.text }}>
              <Text style={{ color: themeColors.text }}>Unique device IDs and expiring QR codes ensure only real attendees check in.</Text>
            </Panel>
            <Panel header="How does it engage students?" key="3" style={{ color: themeColors.text }}>
              <Text style={{ color: themeColors.text }}>Post-scan feedback lets students share thoughts, connecting them to the class.</Text>
            </Panel>
            <Panel header="Can I analyze attendance data?" key="4" style={{ color: themeColors.text }}>
              <Text style={{ color: themeColors.text }}>Yes, export detailed reports or view trends with one tap.</Text>
            </Panel>
          </Collapse>
        </section>

        {/* Roadmap */}
        <section style={{ padding: '80px 0', background: themeColors.cardBg }}>
          <Title level={2} style={{ marginBottom: '40px', color: themeColors.text }}>What’s Coming Next</Title>
          <Row gutter={[40, 40]}>
            <Col xs={24} md={8}>
              <Card hoverable style={{ borderRadius: '10px', background: themeColors.cardGradient1, border: 'none' }}>
                <Title level={4} style={{ color: themeColors.text }}>Q1 2026</Title>
                <Text style={{ color: themeColors.text }}>Rich engagement dashboards for students</Text>
              </Card>
            </Col>
            <Col xs={24} md={8}>
              <Card hoverable style={{ borderRadius: '10px', background: themeColors.cardGradient2, border: 'none' }}>
                <Title level={4} style={{ color: themeColors.text }}>Q2 2026</Title>
                <Text style={{ color: themeColors.text }}>Facial recognition for extra security</Text>
              </Card>
            </Col>
            <Col xs={24} md={8}>
              <Card hoverable style={{ borderRadius: '10px', background: themeColors.cardGradient1, border: 'none' }}>
                <Title level={4} style={{ color: themeColors.text }}>Q3 2026</Title>
                <Text style={{ color: themeColors.text }}>Global language support rollout</Text>
              </Card>
            </Col>
          </Row>
        </section>

        {/* CTA Section */}
        <section style={{ padding: '100px 0', background: `linear-gradient(145deg, ${themeColors.background} 0%, ${themeColors.cardBg} 100%)` }}>
          <Title level={2} style={{ marginBottom: '30px', color: themeColors.text }}>
            Ready to Roll with QRollCall?
          </Title>
          <Text style={{ fontSize: '18px', marginBottom: '40px', display: 'block', color: themeColors.text, opacity: 0.85 }}>
            Join thousands of educators simplifying attendance today.
          </Text>
          <Button
            type="primary"
            size="large"
            onClick={() => navigate('/auth/login')}
            style={{ padding: '0 50px', height: '60px', fontSize: '18px', background: themeColors.primary, borderColor: themeColors.primary }}
          >
            Get Started Free
          </Button>
        </section>
      </Content>

      {/* Footer */}
      <Footer style={{ background: themeColors.cardBg, color: themeColors.text, padding: '40px 0', textAlign: 'center' }}>
        <Row gutter={[40, 40]} justify="center">
          <Col xs={24} md={8}>
            <Title level={4} style={{ color: themeColors.text }}>QRollCall</Title>
            <Text style={{ color: themeColors.text }}>Smart attendance for smarter education.</Text>
          </Col>
          <Col xs={24} md={8}>
            <Title level={4} style={{ color: themeColors.text }}>Links</Title>
            <Space direction="vertical">
              <a href="#features" style={{ color: themeColors.text }}>Features</a>
              <a href="#testimonials" style={{ color: themeColors.text }}>Testimonials</a>
              <a href="#faq" style={{ color: themeColors.text }}>FAQ</a>
            </Space>
          </Col>
          <Col xs={24} md={8}>
            <Title level={4} style={{ color: themeColors.text }}>Contact</Title>
            <Text style={{ color: themeColors.text }}>Email: hello@qrollcall.com</Text>
            <br />
            <Text style={{ color: themeColors.text }}>Phone: +1 (555) 123-4567</Text>
          </Col>
        </Row>
        <Row justify="center" style={{ marginTop: '40px' }}>
          <Text style={{ color: themeColors.text }}>© {new Date().getFullYear()} QRollCall. All rights reserved.</Text>
        </Row>
      </Footer>

      <style>{`
        .ant-btn-ghost:hover {
          color: ${themeColors.secondary} !important;
          border-color: ${themeColors.secondary} !important;
        }
        .ant-collapse-header {
          color: ${themeColors.text} !important;
        }
        .ant-collapse-content {
          background: ${themeColors.cardBg} !important;
          color: ${themeColors.text} !important;
        }
        .ant-carousel .custom-dots li button {
          background: ${themeColors.text} !important;
        }
        .ant-carousel .custom-dots li.slick-active button {
          background: ${themeColors.primary} !important;
        }
      `}</style>
    </Layout>
  );
};

export default Home;