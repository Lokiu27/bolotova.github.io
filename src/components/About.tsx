import { Card } from "@/components/ui/card";
import { Users, Sparkles, Target } from "lucide-react";

const About = () => {
  const features = [
    {
      icon: Users,
      title: "Формирование команд",
      description: "Создаю сильные команды бизнес-аналитиков с фокусом на синергию и эффективность",
    },
    {
      icon: Sparkles,
      title: "AI инструменты",
      description: "Внедряю передовые AI решения для автоматизации аналитических процессов",
    },
    {
      icon: Target,
      title: "Стратегический подход",
      description: "Разрабатываю долгосрочные стратегии развития аналитических команд",
    },
  ];

  return (
    <section id="about" className="py-20 px-4 bg-background">
      <div className="max-w-6xl mx-auto">
        <h2 className="text-4xl font-bold text-center mb-4 text-foreground">О моей работе</h2>
        <p className="text-center text-muted-foreground mb-12 max-w-2xl mx-auto text-lg">
          Специализируюсь на построении эффективных команд бизнес-аналитиков
          и интеграции современных AI инструментов в рабочие процессы.
        </p>

        <div className="grid md:grid-cols-3 gap-6">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <Card
                key={index}
                className="p-8 hover:shadow-card transition-all duration-300 border-border/50 hover:border-primary/30 bg-card"
              >
                <div className="w-14 h-14 rounded-xl bg-gradient-hero flex items-center justify-center mb-6">
                  <Icon className="w-7 h-7 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-3 text-foreground">{feature.title}</h3>
                <p className="text-muted-foreground leading-relaxed">{feature.description}</p>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default About;
