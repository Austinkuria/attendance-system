import { Layout, Button, Typography, Row, Col, Card, Space, Collapse, Carousel, Spin } from 'antd';
import { useNavigate } from 'react-router-dom';
import { QrcodeOutlined, ClockCircleOutlined, SafetyOutlined, BarChartOutlined, TeamOutlined, GlobalOutlined, PlayCircleOutlined, MessageOutlined } from '@ant-design/icons';
import { animated, useSpring } from '@react-spring/web';
import { useState, useEffect } from 'react';

const { Header, Content, Footer } = Layout;
const { Title, Text } = Typography;
const { Panel } = Collapse;

// Animated QR code component
const AnimatedQR = animated(() => (
  <QrcodeOutlined style={{ fontSize: '220px', color: '#52c41a', margin: '40px 0' }} />
));

const Home = () => {
  const navigate = useNavigate();
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
      setScanCount((prev) => prev + Math.floor(Math.random() * 3) + 1); // Subtle, realistic increments
    }, 4000); // Slower for natural feel
    return () => clearInterval(interval);
  }, []);

  // Simulate loading delay
  useEffect(() => {
    setTimeout(() => setLoading(false), 1200); // Faster loading for better UX
  }, []);

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <Spin size="large" tip="Loading QRollCall..." />
      </div>
    );
  }

  return (
    <Layout style={{ minHeight: '100vh', textAlign: 'center' }}>
      {/* Header */}
      <Header style={{ background: '#1f2a44', padding: '16px' }}>
        <Row justify="space-between" align="middle">
          <Col>
            <Title level={3} style={{ color: '#fff', margin: 0 }}>QRollCall</Title>
          </Col>
          <Col>
            <Button ghost onClick={() => navigate('/auth/login')}>Try Now</Button>
          </Col>
        </Row>
      </Header>

      <Content style={{ padding: '0 50px' }}>
        {/* Hero Section */}
        <section style={{ padding: '120px 0', background: 'linear-gradient(145deg, #e6f7e6 0%, #b7e1cd 100%)' }}>
          <Title level={1} style={{ marginBottom: '20px', color: '#1f2a44' }}>
            Attendance, Redefined
          </Title>
          <animated.div style={taglineAnimation}>
            <Text style={{ fontSize: '20px', color: '#555', display: 'block', marginBottom: '40px' }}>
              Scan. Track. Engage. Attendance made simple and smart.
            </Text>
          </animated.div>
          <AnimatedQR style={qrAnimation} />
          <Space size="large">
            <Button
              type="primary"
              size="large"
              onClick={() => navigate('/auth/login')}
              style={{ padding: '0 40px', height: '50px', background: '#52c41a', borderColor: '#52c41a' }}
            >
              Start Free Trial
            </Button>
            <Button
              size="large"
              onClick={() => document.getElementById('features').scrollIntoView({ behavior: 'smooth' })}
              style={{ padding: '0 40px', height: '50px' }}
            >
              Explore Features
            </Button>
          </Space>
          <div style={{ marginTop: '40px' }}>
            <Text strong style={{ fontSize: '16px', color: '#1f2a44' }}>
              <GlobalOutlined /> Loved by educators in 20+ countries
            </Text>
          </div>
        </section>

        {/* Live Counter */}
        <section style={{ padding: '40px 0', background: '#fff', boxShadow: '0 2px 10px rgba(0,0,0,0.1)' }}>
          <Title level={4} style={{ color: '#52c41a' }}>
            <ClockCircleOutlined /> Live Scans: {scanCount.toLocaleString()}
          </Title>
        </section>

        {/* Features Grid */}
        <section id="features" style={{ padding: '80px 0' }}>
          <Title level={2} style={{ marginBottom: '60px', color: '#1f2a44' }}>Why QRollCall?</Title>
          <Row gutter={[40, 40]} justify="center">
            <Col xs={24} sm={12} md={8}>
              <Card hoverable style={{ borderRadius: '10px' }}>
                <ClockCircleOutlined style={{ fontSize: '40px', color: '#52c41a' }} />
                <Title level={4} style={{ margin: '20px 0' }}>Instant Precision</Title>
                <Text>Real-time QR scans deliver accurate attendance updates instantly.</Text>
              </Card>
            </Col>
            <Col xs={24} sm={12} md={8}>
              <Card hoverable style={{ borderRadius: '10px' }}>
                <SafetyOutlined style={{ fontSize: '40px', color: '#52c41a' }} />
                <Title level={4} style={{ margin: '20px 0' }}>Fraud-Proof</Title>
                <Text>Device tracking and dynamic QR codes stop proxy attendance.</Text>
              </Card>
            </Col>
            <Col xs={24} sm={12} md={8}>
              <Card hoverable style={{ borderRadius: '10px' }}>
                <MessageOutlined style={{ fontSize: '40px', color: '#52c41a' }} />
                <Title level={4} style={{ margin: '20px 0' }}>Engage Students</Title>
                <Text>Post-session feedback boosts participation and insights.</Text>
              </Card>
            </Col>
          </Row>
        </section>

        {/* Video Demo Section */}
        <section style={{ padding: '80px 0', background: '#f0f2f5' }}>
          <Title level={2} style={{ marginBottom: '40px', color: '#1f2a44' }}>See QRollCall in Action</Title>
          <Row justify="center">
            <Col xs={24} md={18}>
              <div style={{
                position: 'relative',
                paddingBottom: '56.25%', // 16:9 aspect ratio
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
                  src="https://www.youtube.com/embed/dQw4w9WgXcQ?si=your-placeholder-id" // Placeholder: Rickroll as a fun demo
                  title="QRollCall Demo"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                ></iframe>
              </div>
              <Text style={{ display: 'block', marginTop: '20px', color: '#555' }}>
                Watch how QRollCall simplifies attendance in 90 seconds!
              </Text>
            </Col>
          </Row>
        </section>

        {/* Testimonials */}
        <section style={{ padding: '80px 0', background: '#fff' }}>
          <Title level={2} style={{ marginBottom: '40px', color: '#1f2a44' }}>Voices of Educators</Title>
          <Carousel autoplay dots={{ className: 'custom-dots' }}>
            <div>
              <Card style={{ maxWidth: '600px', margin: '0 auto' }}>
                <Text>"QRollCall’s instant scans cut our attendance time in half."</Text>
                <Text strong block style={{ marginTop: '10px' }}>- Dr. Maya Patel, Horizon University</Text>
              </Card>
            </div>
            <div>
              <Card style={{ maxWidth: '600px', margin: '0 auto' }}>
                <Text>"No more proxy issues—device tracking is a game-changer."</Text>
                <Text strong block style={{ marginTop: '10px' }}>- Prof. Liam Carter, Summit College</Text>
              </Card>
            </div>
            <div>
              <Card style={{ maxWidth: '600px', margin: '0 auto' }}>
                <Text>"Students love the feedback feature—it’s sparked real dialogue."</Text>
                <Text strong block style={{ marginTop: '10px' }}>- Ms. Elena Ortiz, Bright Academy</Text>
              </Card>
            </div>
          </Carousel>
        </section>

        {/* Team & Training Section */}
        <section style={{ padding: '80px 0', background: '#f0f2f5' }}>
          <Title level={2} style={{ marginBottom: '40px', color: '#1f2a44' }}>Built for Teams</Title>
          <Row gutter={[40, 40]} justify="center">
            <Col xs={24} md={12}>
              <TeamOutlined style={{ fontSize: '100px', color: '#52c41a' }} />
              <Title level={4} style={{ margin: '20px 0' }}>Team Sync</Title>
              <Text>Real-time data sharing for instructors and admins.</Text>
            </Col>
            <Col xs={24} md={12}>
              <PlayCircleOutlined style={{ fontSize: '100px', color: '#52c41a' }} />
              <Title level={4} style={{ margin: '20px 0' }}>Fast Onboarding</Title>
              <Text>Interactive tutorials and 24/7 support to get you started.</Text>
            </Col>
          </Row>
        </section>

        {/* FAQ Section */}
        <section style={{ padding: '80px 0' }}>
          <Title level={2} style={{ marginBottom: '40px', color: '#1f2a44' }}>Got Questions?</Title>
          <Collapse accordion bordered={false} style={{ background: '#fff', borderRadius: '10px' }}>
            <Panel header="How does QRollCall work?" key="1">
              <Text>Generate a QR code per class. Students scan it, and attendance logs instantly.</Text>
            </Panel>
            <Panel header="How does it stop proxy attendance?" key="2">
              <Text>Unique device IDs and expiring QR codes ensure only real attendees check in.</Text>
            </Panel>
            <Panel header="How does it engage students?" key="3">
              <Text>Post-scan feedback lets students share thoughts, connecting them to the class.</Text>
            </Panel>
            <Panel header="Can I analyze attendance data?" key="4">
              <Text>Yes, export detailed reports or view trends with one tap.</Text>
            </Panel>
          </Collapse>
        </section>

        {/* Roadmap */}
        <section style={{ padding: '80px 0', background: '#f0f2f5' }}>
          <Title level={2} style={{ marginBottom: '40px', color: '#1f2a44' }}>What’s Coming Next</Title>
          <Row gutter={[40, 40]}>
            <Col xs={24} md={8}>
              <Card hoverable style={{ borderRadius: '10px' }}>
                <Title level={4}>Q1 2026</Title>
                <Text>Rich engagement dashboards for students</Text>
              </Card>
            </Col>
            <Col xs={24} md={8}>
              <Card hoverable style={{ borderRadius: '10px' }}>
                <Title level={4}>Q2 2026</Title>
                <Text>Facial recognition for extra security</Text>
              </Card>
            </Col>
            <Col xs={24} md={8}>
              <Card hoverable style={{ borderRadius: '10px' }}>
                <Title level={4}>Q3 2026</Title>
                <Text>Global language support rollout</Text>
              </Card>
            </Col>
          </Row>
        </section>

        {/* CTA Section */}
        <section style={{ padding: '100px 0', background: 'linear-gradient(145deg, #e6f7e6 0%, #b7e1cd 100%)' }}>
          <Title level={2} style={{ marginBottom: '30px', color: '#1f2a44' }}>
            Ready to Roll with QRollCall?
          </Title>
          <Text style={{ fontSize: '18px', marginBottom: '40px', display: 'block', color: '#555' }}>
            Join thousands of educators simplifying attendance today.
          </Text>
          <Button
            type="primary"
            size="large"
            onClick={() => navigate('/auth/login')}
            style={{ padding: '0 50px', height: '60px', fontSize: '18px', background: '#52c41a', borderColor: '#52c41a' }}
          >
            Get Started Free
          </Button>
        </section>
      </Content>

      {/* Footer */}
      <Footer style={{ background: '#1f2a44', color: '#fff', padding: '40px 0', textAlign: 'center' }}>
        <Row gutter={[40, 40]} justify="center">
          <Col xs={24} md={8}>
            <Title level={4} style={{ color: '#fff' }}>QRollCall</Title>
            <Text style={{ color: '#fff' }}>Smart attendance for smarter education.</Text>
          </Col>
          <Col xs={24} md={8}>
            <Title level={4} style={{ color: '#fff' }}>Links</Title>
            <Space direction="vertical">
              <a href="#features" style={{ color: '#fff' }}>Features</a>
              <a href="#testimonials" style={{ color: '#fff' }}>Testimonials</a>
              <a href="#faq" style={{ color: '#fff' }}>FAQ</a>
            </Space>
          </Col>
          <Col xs={24} md={8}>
            <Title level={4} style={{ color: '#fff' }}>Contact</Title>
            <Text style={{ color: '#fff' }}>Email: hello@qrollcall.com</Text>
            <br />
            <Text style={{ color: '#fff' }}>Phone: +1 (555) 123-4567</Text>
          </Col>
        </Row>
        <Row justify="center" style={{ marginTop: '40px' }}>
          <Text style={{ color: '#fff' }}>© {new Date().getFullYear()} QRollCall. All rights reserved.</Text>
        </Row>
      </Footer>
    </Layout>
  );
};

export default Home;