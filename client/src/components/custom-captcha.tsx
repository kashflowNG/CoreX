import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { RefreshCw, Shield } from "lucide-react";

interface CustomCaptchaProps {
  onVerify: (isValid: boolean, token: string) => void;
  className?: string;
}

export function CustomCaptcha({ onVerify, className = "" }: CustomCaptchaProps) {
  const [captchaData, setCaptchaData] = useState({
    question: "",
    answer: 0,
    userAnswer: "",
    isVerified: false,
    token: ""
  });

  const generateCaptcha = useCallback(() => {
    const operations = ['+', '-', '×'];
    const operation = operations[Math.floor(Math.random() * operations.length)];
    
    let num1, num2, answer, question;
    
    switch (operation) {
      case '+':
        num1 = Math.floor(Math.random() * 20) + 1;
        num2 = Math.floor(Math.random() * 20) + 1;
        answer = num1 + num2;
        question = `${num1} + ${num2} = ?`;
        break;
      case '-':
        num1 = Math.floor(Math.random() * 30) + 10;
        num2 = Math.floor(Math.random() * num1) + 1;
        answer = num1 - num2;
        question = `${num1} - ${num2} = ?`;
        break;
      case '×':
        num1 = Math.floor(Math.random() * 10) + 1;
        num2 = Math.floor(Math.random() * 10) + 1;
        answer = num1 * num2;
        question = `${num1} × ${num2} = ?`;
        break;
      default:
        num1 = 5;
        num2 = 3;
        answer = 8;
        question = "5 + 3 = ?";
    }

    const token = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    
    setCaptchaData({
      question,
      answer,
      userAnswer: "",
      isVerified: false,
      token
    });
  }, []);

  useEffect(() => {
    generateCaptcha();
  }, [generateCaptcha]);

  const handleInputChange = (value: string) => {
    const numericValue = value.replace(/[^0-9]/g, '');
    setCaptchaData(prev => ({ ...prev, userAnswer: numericValue }));
  };

  const handleVerify = () => {
    const isCorrect = parseInt(captchaData.userAnswer) === captchaData.answer;
    
    if (isCorrect) {
      setCaptchaData(prev => ({ ...prev, isVerified: true }));
      onVerify(true, captchaData.token);
    } else {
      setCaptchaData(prev => ({ ...prev, isVerified: false, userAnswer: "" }));
      onVerify(false, "");
      generateCaptcha();
    }
  };

  const handleRefresh = () => {
    setCaptchaData(prev => ({ ...prev, isVerified: false, userAnswer: "" }));
    onVerify(false, "");
    generateCaptcha();
  };

  return (
    <Card className={`p-4 border-2 ${captchaData.isVerified ? 'border-green-500 bg-green-50 dark:bg-green-900/20' : 'border-muted'} ${className}`}>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-bitcoin" />
            <span className="text-sm font-medium">Security Verification</span>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleRefresh}
            className="h-8 w-8 p-0"
          >
            <RefreshCw className="w-4 h-4" />
          </Button>
        </div>

        {captchaData.isVerified ? (
          <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
            <Shield className="w-5 h-5" />
            <span className="font-medium">Verification Complete</span>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="text-center">
              <div className="text-2xl font-mono font-bold bg-muted p-3 rounded-lg border">
                {captchaData.question}
              </div>
            </div>
            
            <div className="flex gap-2">
              <input
                type="text"
                value={captchaData.userAnswer}
                onChange={(e) => handleInputChange(e.target.value)}
                placeholder="Enter answer"
                className="flex-1 px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-bitcoin focus:border-transparent"
                maxLength={3}
              />
              <Button
                type="button"
                onClick={handleVerify}
                disabled={!captchaData.userAnswer}
                className="px-6"
              >
                Verify
              </Button>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}