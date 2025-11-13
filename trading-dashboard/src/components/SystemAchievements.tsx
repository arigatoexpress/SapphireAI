import React from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Chip,
  Avatar,
  LinearProgress,
  Badge,
} from '@mui/material';
import {
  Psychology,
  TrendingUp,
  Assessment,
  Memory,
  Speed,
  SmartToy,
  Analytics,
  EmojiEvents,
  Whatshot,
  Star,
  Bolt,
  Shield,
  CloudQueue,
  Security,
  Timeline,
  Verified,
  Rocket,
  PrecisionManufacturing,
  Biotech,
  Psychology as BrainIcon,
  MilitaryTech,
  Architecture,
  Engineering,
} from '@mui/icons-material';

const SystemAchievements: React.FC = () => {
  const achievements = [
    {
      category: "AI & Machine Learning",
      icon: <BrainIcon sx={{ color: '#8b5cf6' }} />,
      items: [
        { name: "Multi-Model AI Ensemble", description: "5 specialized AI agents working in harmony", status: "active" },
        { name: "Advanced NLP Processing", description: "Real-time market sentiment analysis", status: "active" },
        { name: "Predictive Analytics", description: "Machine learning-driven trading signals", status: "active" },
        { name: "Adaptive Learning", description: "Continuous model optimization", status: "active" },
      ]
    },
    {
      category: "Enterprise Performance",
      icon: <Bolt sx={{ color: '#06b6d4' }} />,
      items: [
        { name: "Sub-100ms Latency", description: "Lightning-fast trade execution", status: "active" },
        { name: "1000+ RPS Capability", description: "High-frequency trading throughput", status: "active" },
        { name: "99.9% Uptime Architecture", description: "Enterprise-grade reliability", status: "active" },
        { name: "Auto-Scaling Infrastructure", description: "Dynamic resource optimization", status: "active" },
      ]
    },
    {
      category: "Risk Management",
      icon: <Shield sx={{ color: '#10b981' }} />,
      items: [
        { name: "Advanced Portfolio Analytics", description: "VaR, Sharpe ratio, drawdown control", status: "active" },
        { name: "Real-time Risk Monitoring", description: "Continuous exposure assessment", status: "active" },
        { name: "Market Regime Adaptation", description: "Dynamic risk adjustment", status: "active" },
        { name: "Automated Risk Controls", description: "Intelligent position management", status: "active" },
      ]
    },
    {
      category: "System Resilience",
      icon: <Security sx={{ color: '#f59e0b' }} />,
      items: [
        { name: "Circuit Breaker Protection", description: "Automatic failure isolation", status: "active" },
        { name: "Self-Healing Architecture", description: "Automated recovery systems", status: "active" },
        { name: "Graceful Degradation", description: "Maintains operation during failures", status: "active" },
        { name: "Comprehensive Monitoring", description: "24/7 system health tracking", status: "active" },
      ]
    },
    {
      category: "Cloud-Native Architecture",
      icon: <CloudQueue sx={{ color: '#8b5cf6' }} />,
      items: [
        { name: "Kubernetes Orchestration", description: "Container-native deployment", status: "active" },
        { name: "Microservices Design", description: "Modular, scalable architecture", status: "active" },
        { name: "Event-Driven Processing", description: "Real-time data pipelines", status: "active" },
        { name: "Distributed Caching", description: "High-performance data access", status: "active" },
      ]
    },
    {
      category: "Regulatory Compliance",
      icon: <Verified sx={{ color: '#059669' }} />,
      items: [
        { name: "Audit Trail Integrity", description: "Tamper-proof transaction logging", status: "active" },
        { name: "Automated Compliance", description: "Real-time regulatory monitoring", status: "active" },
        { name: "Data Retention Policies", description: "Secure record management", status: "active" },
        { name: "Access Control Framework", description: "Multi-level security controls", status: "active" },
      ]
    }
  ];

  return (
    <Box sx={{ mb: 4 }}>
      <Typography
        variant="h4"
        sx={{
          mb: 3,
          fontWeight: 700,
          textAlign: 'center',
          background: 'linear-gradient(135deg, #8b5cf6, #ec4899, #06b6d4)',
          backgroundClip: 'text',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
        }}
      >
        🏆 System Achievements & Capabilities
      </Typography>

      <Typography
        variant="body1"
        sx={{
          mb: 4,
          textAlign: 'center',
          color: 'text.secondary',
          maxWidth: '800px',
          mx: 'auto',
          lineHeight: 1.6
        }}
      >
        Enterprise-grade algorithmic trading platform featuring cutting-edge AI technology,
        military-level resilience, and institutional-grade risk management.
      </Typography>

      <Grid container spacing={3}>
        {achievements.map((category, categoryIndex) => (
          <Grid item xs={12} md={6} lg={4} key={categoryIndex}>
            <Card
              sx={{
                height: '100%',
                background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.8), rgba(30, 41, 59, 0.4))',
                backdropFilter: 'blur(20px)',
                border: '1px solid rgba(139, 92, 246, 0.2)',
                borderRadius: '20px',
                transition: 'all 0.3s ease',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  border: '1px solid rgba(139, 92, 246, 0.4)',
                  boxShadow: '0 20px 40px rgba(139, 92, 246, 0.1)',
                }
              }}
            >
              <CardContent sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                  <Avatar
                    sx={{
                      bgcolor: 'rgba(139, 92, 246, 0.1)',
                      border: '1px solid rgba(139, 92, 246, 0.3)',
                      mr: 2,
                      width: 48,
                      height: 48
                    }}
                  >
                    {category.icon}
                  </Avatar>
                  <Box>
                    <Typography variant="h6" sx={{ fontWeight: 700, mb: 0.5 }}>
                      {category.category}
                    </Typography>
                    <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                      {category.items.length} Advanced Features
                    </Typography>
                  </Box>
                </Box>

                <Box sx={{ spaceY: 2 }}>
                  {category.items.map((item, itemIndex) => (
                    <Box
                      key={itemIndex}
                      sx={{
                        mb: 2,
                        p: 2,
                        borderRadius: 2,
                        bgcolor: 'rgba(30, 41, 59, 0.3)',
                        border: '1px solid rgba(148, 163, 184, 0.1)',
                      }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          {item.name}
                        </Typography>
                        <Chip
                          size="small"
                          label={item.status}
                          sx={{
                            bgcolor: item.status === 'active' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(245, 158, 11, 0.1)',
                            color: item.status === 'active' ? '#10b981' : '#f59e0b',
                            fontSize: '0.7rem',
                            height: 20
                          }}
                        />
                      </Box>
                      <Typography variant="caption" sx={{ color: 'text.secondary', lineHeight: 1.4 }}>
                        {item.description}
                      </Typography>
                    </Box>
                  ))}
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* System Status Overview */}
      <Box sx={{ mt: 4 }}>
        <Card
          sx={{
            background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.9), rgba(30, 41, 59, 0.6))',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(6, 182, 212, 0.3)',
            borderRadius: '20px',
          }}
        >
          <CardContent sx={{ p: 4 }}>
            <Typography
              variant="h5"
              sx={{
                mb: 3,
                fontWeight: 700,
                textAlign: 'center',
                background: 'linear-gradient(135deg, #06b6d4, #8b5cf6)',
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              🚀 Enterprise-Grade Trading Platform
            </Typography>

            <Grid container spacing={3}>
              <Grid item xs={12} md={3}>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="h3" sx={{ fontWeight: 900, color: '#10b981', mb: 1 }}>
                    99.9%
                  </Typography>
                  <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 600 }}>
                    System Uptime
                  </Typography>
                </Box>
              </Grid>

              <Grid item xs={12} md={3}>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="h3" sx={{ fontWeight: 900, color: '#06b6d4', mb: 1 }}>
                    100ms
                  </Typography>
                  <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 600 }}>
                    P95 Latency
                  </Typography>
                </Box>
              </Grid>

              <Grid item xs={12} md={3}>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="h3" sx={{ fontWeight: 900, color: '#8b5cf6', mb: 1 }}>
                    1000+
                  </Typography>
                  <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 600 }}>
                    RPS Capacity
                  </Typography>
                </Box>
              </Grid>

              <Grid item xs={12} md={3}>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="h3" sx={{ fontWeight: 900, color: '#f59e0b', mb: 1 }}>
                    7-Layer
                  </Typography>
                  <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 600 }}>
                    Resilience Stack
                  </Typography>
                </Box>
              </Grid>
            </Grid>

            <Box sx={{ mt: 4, p: 3, borderRadius: 2, bgcolor: 'rgba(30, 41, 59, 0.4)' }}>
              <Typography variant="body1" sx={{ textAlign: 'center', fontWeight: 600, mb: 2 }}>
                🎯 Production-Ready Features
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, justifyContent: 'center' }}>
                {[
                  'Real-time AI Analysis',
                  'Advanced Risk Management',
                  'Self-Healing Architecture',
                  'Enterprise Security',
                  'Regulatory Compliance',
                  'High-Frequency Trading',
                  'Cloud-Native Design',
                  '24/7 Monitoring'
                ].map((feature, index) => (
                  <Chip
                    key={index}
                    label={feature}
                    size="small"
                    sx={{
                      bgcolor: 'rgba(139, 92, 246, 0.1)',
                      color: '#8b5cf6',
                      border: '1px solid rgba(139, 92, 246, 0.3)',
                      '&:hover': {
                        bgcolor: 'rgba(139, 92, 246, 0.2)',
                      }
                    }}
                  />
                ))}
              </Box>
            </Box>
          </CardContent>
        </Card>
      </Box>
    </Box>
  );
};

export default SystemAchievements;
