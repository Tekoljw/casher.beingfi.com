const handleMatchDetails = async (id: string) => {
  try {
    const response = await fetch(`http://${import.meta.env.VITE_API_HOST}/Api/Index/paymentMatchOrder`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ id }),
    });

    if (!response.ok) {
      throw new Error('匹配订单失败');
    }

    const data = await response.json();
    if (data.code === 0) {
      message.success('匹配订单成功');
      // 刷新页面数据
      fetchAccounts();
    } else {
      message.error(data.msg || '匹配订单失败');
    }
  } catch (error) {
    console.error('匹配订单错误:', error);
    message.error('匹配订单失败，请稍后重试');
  }
}; 