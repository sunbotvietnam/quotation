# Test plan T01–T15

Chạy kiểm thử engine cục bộ:

```bash
node tests/pricing-engine.test.js
```

Bộ tự động bao phủ T01–T15: price version, SKU động, role visibility contract, floor guard, support tiers, operator cap/minimum, legacy override, snapshot, archived SKU, tamper payload, agent/API guard và missing active price.

Trước cutover phải chạy thêm integration test trên deployment Apps Script bằng tài khoản test Sales/Leader/CEO/Admin, kiểm tra network response của Sales không chứa `floor_price`, tạo quote thật trên Sheet test, approve, mở lại snapshot sau khi tạo price version mới, và xác nhận audit rows.
