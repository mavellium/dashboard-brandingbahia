"use client";

import { motion } from "framer-motion";
import { Card } from "@/components/Card";

interface FeedbackMessagesProps {
  success?: boolean;
  errorMsg: string;
}

export function FeedbackMessages({ success, errorMsg }: FeedbackMessagesProps) {
  return (
    <>
      {success && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-6"
        >
          <Card className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
            <p className="text-green-700 dark:text-green-400 font-semibold text-center">
              ✅ Dados salvos com sucesso!
            </p>
          </Card>
        </motion.div>
      )}

      {errorMsg && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-6"
        >
          <Card className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
            <p className="text-red-700 dark:text-red-400 font-semibold text-center">
              {errorMsg}
            </p>
          </Card>
        </motion.div>
      )}
    </>
  );
}